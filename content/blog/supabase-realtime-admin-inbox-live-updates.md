---
title: "A live admin inbox with Supabase Realtime: new messages appear without refreshing, and the badge stays right"
description: "The admin side of this site shows contact messages and feedback. It used to need a refresh to see new ones. Supabase Realtime streams Postgres changes over a websocket, and the inbox now updates the moment a row lands. The setup, the RLS that keeps the channel private, the reconnect handling, and why the badge count comes from the server anyway."
date: 2028-05-15T03:30:00Z
tags: [supabase, realtime, nextjs, react, postgres]
keywords: [supabase realtime postgres changes next.js, supabase realtime rls private channel, live notifications supabase, supabase realtime reconnect, admin inbox live updates]
project: portfolio
image: /blog/stock/mobile-2.webp
imageAlt: "Taking a photo with a smartphone"
imageCredit: "James Sutton jamessutton_photography"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Smartphone_photographer_(Unsplash).jpg"
imageLicense: "CC0"
summary: "Add the table to the supabase_realtime publication, subscribe from a client component to inserts and updates, patch the server-rendered list, and refetch the unread count from the database on every event and reconnect. Row-level security decides what each subscriber receives."
faq:
  - q: "Can anonymous visitors listen to my admin table over Realtime?"
    a: "Only if a read policy allows them. Realtime applies row-level security per subscriber, so a table with no anonymous select policy sends nothing to them."
  - q: "Why not count unread messages from the live list in the client?"
    a: "The list is paginated and a dropped socket silently makes the count wrong. Use the events as a trigger to recount on the server."
  - q: "What happens to events while the laptop was asleep?"
    a: "They are not delivered. On the reconnect transition, refetch the list and the count so nothing is missed."
---

The admin inbox is a server component that lists rows from `contact_messages`. Fine for reading; stale within seconds of a new message. Supabase Realtime subscribes the browser to row changes on that table, so the list and the unread badge update as messages arrive. It is about forty lines of client code and one database setting.

## Enable the publication

Realtime only streams tables added to its publication:

```sql
alter publication supabase_realtime add table contact_messages;
```

And the table must have row-level security that allows the subscriber to *read* the rows, because Realtime applies RLS to every change it sends. The admin's policy already allowed `select` for the admin role; anonymous visitors have no read policy on this table, so even if they opened a channel they would receive nothing.

## The client subscription

```tsx
"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import type { Message } from "@/lib/types";

export function LiveInbox({ initial }: { initial: Message[] }) {
  const [messages, setMessages] = useState(initial);
  const [status, setStatus] = useState<"live" | "connecting" | "offline">("connecting");

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-inbox")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contact_messages" }, (payload) => {
        setMessages((prev) => prev.some((m) => m.id === payload.new.id) ? prev : [payload.new as Message, ...prev]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contact_messages" }, (payload) => {
        setMessages((prev) => prev.map((m) => (m.id === payload.new.id ? { ...m, ...(payload.new as Message) } : m)));
      })
      .subscribe((s) => setStatus(s === "SUBSCRIBED" ? "live" : s === "CLOSED" || s === "CHANNEL_ERROR" ? "offline" : "connecting"));

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <>
      <StatusDot status={status} />
      {messages.map((m) => <MessageRow key={m.id} message={m} />)}
    </>
  );
}
```

The list starts from the server-rendered data, so there is no empty state, and the subscription only adds and patches. The `some` check guards against receiving an insert the server render already included, which happens when a message lands in the gap between render and subscribe.

## The badge count comes from the server

It is tempting to count unread messages in the client from the live list. Two problems: the list is paginated and the count must cover everything, and a dropped websocket silently makes the count wrong. So the badge is its own tiny query:

```ts
const { count } = await supabase.from("contact_messages").select("*", { count: "exact", head: true }).is("read_at", null);
```

Fetched on render, refetched whenever the channel delivers an insert or update, and refetched on reconnect. The live events are a trigger to recount, not the source of the count. This is the same principle as the caching post: events hint, the database answers.

## Reconnects

Laptops sleep, phones switch networks. The client library reconnects on its own and re-subscribes the channel, and the `subscribe` callback reports the state transitions, which drive the status dot. On the transition back to `SUBSCRIBED` the component refetches the list and the count, because anything inserted while offline was never delivered:

```ts
.subscribe(async (s) => {
  if (s === "SUBSCRIBED" && wasOffline.current) { await refetchAll(); wasOffline.current = false; }
  if (s !== "SUBSCRIBED") wasOffline.current = true;
  setStatus(...);
});
```

## Sound and a title badge

A short tone and `document.title = "(3) Inbox"` on insert, the first one gated behind a user-enabled toggle because autoplay rules block it until the person has interacted, and because an office does not want a ping from every browser tab.

## Limits worth knowing

The free Supabase tier allows a modest number of concurrent Realtime connections and messages per second; a one-admin inbox is nowhere near them. Each `postgres_changes` subscription runs RLS per subscriber per change, so for a table with heavy writes and many subscribers, Broadcast with a server-side trigger is cheaper. For an inbox that gets a few messages a day, `postgres_changes` is exactly right.

## Sources

- Supabase Realtime, Postgres changes: [supabase.com/docs/guides/realtime/postgres-changes](https://supabase.com/docs/guides/realtime/postgres-changes)
- Realtime and row-level security: [supabase.com/docs/guides/realtime/authorization](https://supabase.com/docs/guides/realtime/authorization)
- Realtime limits and pricing: [supabase.com/docs/guides/realtime/limits](https://supabase.com/docs/guides/realtime/limits)
- Supabase JS `channel` API: [supabase.com/docs/reference/javascript/subscribe](https://supabase.com/docs/reference/javascript/subscribe)
- Page Visibility API for pausing work in background tabs: [developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
