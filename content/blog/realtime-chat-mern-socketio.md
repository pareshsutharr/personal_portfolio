---
title: "Real-time chat in a MERN app with Socket.IO: rooms, auth and reconnects"
description: "What I got wrong the first time building owner-to-renter chat for Just Rent It, and the structure that held up: authenticated sockets, one room per conversation, messages saved before they are broadcast, and a client that survives a flaky phone connection."
date: 2026-11-23T03:30:00Z
tags: [socketio, nodejs, react, mongodb, realtime]
keywords: [socket.io chat mern, socket.io authentication jwt, socket.io rooms private chat, socket.io reconnect missed messages, react socket.io hook]
project: justrentit
image: /blog/stock/mobile-2.webp
imageAlt: "Taking a photo with a smartphone"
imageCredit: "James Sutton jamessutton_photography"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Smartphone_photographer_(Unsplash).jpg"
imageLicense: "CC0"
summary: "Authenticate the socket on connection, join one room per conversation, save each message to MongoDB before broadcasting it, and let the client re-join rooms and fetch missed messages on reconnect. The first version lost messages when a socket dropped mid-send."
faq:
  - q: "How do I authenticate a Socket.IO connection?"
    a: "Send the access token in the handshake auth field and verify it in a connection middleware; reject the socket if it fails."
  - q: "Why save before broadcasting?"
    a: "If the broadcast happens first and the save fails, people saw a message that does not exist. Save, then emit with the stored id."
  - q: "What happens when the phone loses connection?"
    a: "Socket.IO reconnects; the client re-joins its rooms and requests messages after the last id it has, so nothing is missed."
---

Just Rent It is a rental marketplace: you list a camera, someone nearby wants it for the weekend, you talk, you agree. The "you talk" part was a Socket.IO chat between the owner and the renter. My first version worked in a demo and fell apart with two real phones on mobile data. Messages arrived twice, or not at all, and anyone who guessed a conversation id could read it.

This is the version that held up.

## The rules I should have started with

1. A socket must prove who it is before it can join anything.
2. A conversation is a room, and only its two participants may join it.
3. Save the message to MongoDB first, then broadcast it. Never the other way round.
4. The client must be able to reconnect and ask "what did I miss?".

Everything below exists to enforce one of those.

## Server: authenticate the socket

Socket.IO lets you run middleware on the handshake. Verify the same JWT the REST API uses, and attach the user to the socket.

```js
import { Server } from "socket.io";
import jwt from "jsonwebtoken";

const io = new Server(httpServer, { cors: { origin: process.env.WEB_ORIGIN } });

io.use((socket, next) => {
  try {
    const payload = jwt.verify(socket.handshake.auth.token, process.env.JWT_SECRET);
    socket.user = { id: payload.sub };
    next();
  } catch {
    next(new Error("unauthorized"));
  }
});
```

The client sends the token in `auth`, not in the query string, so it does not end up in server logs.

## Server: rooms you have to be allowed into

```js
io.on("connection", (socket) => {
  socket.on("conversation:join", async (conversationId, ack) => {
    const convo = await Conversation.findOne({
      _id: conversationId,
      participants: socket.user.id,     // the authorization check
    }).select("_id").lean();
    if (!convo) return ack?.({ ok: false });
    socket.join(`conversation:${conversationId}`);
    ack?.({ ok: true });
  });

  socket.on("message:send", async ({ conversationId, body, clientId }, ack) => {
    const convo = await Conversation.findOne({ _id: conversationId, participants: socket.user.id });
    if (!convo) return ack?.({ ok: false });

    const message = await Message.create({
      conversation: conversationId,
      sender: socket.user.id,
      body: String(body).slice(0, 2000),
      clientId,                           // for de-duplication on the client
    });
    io.to(`conversation:${conversationId}`).emit("message:new", message);
    ack?.({ ok: true, id: message.id });
  });
});
```

The `participants` check runs on every join and every send. It is one indexed query and it is the whole security model. The first version trusted the client's room name, which is how a stranger could read a conversation.

Saving before broadcasting means a message that reached the database is the only kind of message anyone ever sees. If the save fails, nobody sees a ghost.

## Client: one hook, one socket

```ts
import { io, type Socket } from "socket.io-client";
import { useEffect, useRef, useState } from "react";

export function useConversation(conversationId: string, token: string) {
  const socketRef = useRef<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const socket = io(API_BASE, { auth: { token }, transports: ["websocket"] });
    socketRef.current = socket;

    const sync = async () => {
      const last = messages.at(-1)?.createdAt;
      const res = await fetch(`${API_BASE}/api/conversations/${conversationId}/messages${last ? `?after=${last}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } });
      const missed: Message[] = await res.json();
      setMessages((m) => dedupe([...m, ...missed]));
      socket.emit("conversation:join", conversationId);
    };

    socket.on("connect", sync);               // runs on first connect AND every reconnect
    socket.on("message:new", (msg: Message) => setMessages((m) => dedupe([...m, msg])));
    return () => { socket.disconnect(); };
  }, [conversationId, token]);

  const send = (body: string) => {
    const clientId = crypto.randomUUID();
    setMessages((m) => [...m, { clientId, body, sender: "me", pending: true } as Message]);
    socketRef.current?.emit("message:send", { conversationId, body, clientId });
  };

  return { messages, send };
}

const dedupe = (list: Message[]) => {
  const seen = new Set<string>();
  return list.filter((m) => {
    const key = m.clientId ?? m._id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
```

Three things to notice.

**`connect` fires on every reconnect.** Socket.IO reconnects by itself when a phone drops off Wi-Fi, but it does not replay what was missed. Fetching messages after the last one you have, on every `connect`, closes that gap. This single change fixed "messages not arriving" for good.

**`clientId` de-duplicates.** The sender adds the message to the list immediately so the UI feels instant. When the server broadcasts it back, the same `clientId` lets the client replace the pending copy instead of showing it twice.

**`transports: ["websocket"]`** skips the long-polling start. It needs the Nginx `Upgrade` headers I covered in the deployment post, otherwise it will not connect at all.

## The REST endpoint for catching up

```js
router.get("/conversations/:id/messages", requireAuth, async (req, res) => {
  const convo = await Conversation.findOne({ _id: req.params.id, participants: req.user.id });
  if (!convo) return res.status(404).end();
  const filter = { conversation: convo.id };
  if (req.query.after) filter.createdAt = { $gt: new Date(req.query.after) };
  res.json(await Message.find(filter).sort({ createdAt: 1 }).limit(200).lean());
});
```

Index `{ conversation: 1, createdAt: 1 }` on messages. Chat histories grow fast.

## Scaling past one server

With one Node process, `io.to(room)` works because every socket is in the same memory. With two processes behind PM2's cluster mode, or two servers, a message sent to a socket on process A never reaches a user on process B. The fix is the Redis adapter, which forwards room broadcasts between processes:

```js
import { createAdapter } from "@socket.io/redis-adapter";
io.adapter(createAdapter(pubClient, subClient));
```

Just Rent It never needed it. If you run PM2 in cluster mode, you need it from day one.

## Sources

- Socket.IO middleware and authentication: [socket.io/docs/v4/middlewares](https://socket.io/docs/v4/middlewares/)
- Rooms: [socket.io/docs/v4/rooms](https://socket.io/docs/v4/rooms/)
- Client reconnection behaviour: [socket.io/docs/v4/client-socket-instance](https://socket.io/docs/v4/client-socket-instance/#connect)
- Redis adapter for multiple nodes: [socket.io/docs/v4/redis-adapter](https://socket.io/docs/v4/redis-adapter/)
