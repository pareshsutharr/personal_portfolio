---
title: "Firebase push notifications from Node.js: tokens, topics, and dead devices"
description: "Growth HR sends a push when a leave request is approved. Sending is one API call. Keeping the token list clean, sending to the right devices, and not spamming someone with three phones is the real work. Here is the server side."
date: 2027-03-29T03:30:00Z
tags: [firebase, nodejs, mobile, capacitor]
keywords: [firebase admin push notifications node, fcm send to token node.js, firebase messaging invalid token cleanup, fcm topics vs tokens, push notification backend design]
project: growth-avenues-hrms
image: /blog/stock/mobile-3.webp
imageAlt: "Smartphone held in one hand"
imageCredit: "NeONBRAND neonbrand"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Smartphone_in_Hand_(Unsplash).jpg"
imageLicense: "CC0"
---

The Capacitor post covered the phone side of push notifications: asking permission, getting a token, saving it. This is the server side, where the HRMS decides who to notify, sends through Firebase Cloud Messaging, and deals with the tokens that stop working.

## Store tokens per device, not per user

A person has a phone and sometimes a tablet, replaces the phone, reinstalls the app. Each of those is a token. Model it that way:

```js
const deviceSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: "User", index: true },
  token: { type: String, unique: true },
  platform: { type: String, enum: ["android", "ios"] },
  lastSeenAt: Date,
}, { timestamps: true });
```

The app re-registers on every launch; the API upserts by token and bumps `lastSeenAt`. If a token moves to a different user, which happens when two people share a tablet, the upsert reassigns it rather than notifying the wrong person.

## Sending

```js
import admin from "firebase-admin";
admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)) });

export async function notifyUser(userId, { title, body, path }) {
  const devices = await Device.find({ user: userId }).select("token").lean();
  if (!devices.length) return;

  const res = await admin.messaging().sendEachForMulticast({
    tokens: devices.map((d) => d.token),
    notification: { title, body },
    data: { path },
    android: { priority: "high", notification: { channelId: "hr" } },
    apns: { payload: { aps: { sound: "default" } } },
  });

  const dead = res.responses
    .map((r, i) => (!r.success && isDeadToken(r.error) ? devices[i].token : null))
    .filter(Boolean);
  if (dead.length) await Device.deleteMany({ token: { $in: dead } });
}

const isDeadToken = (err) =>
  ["messaging/registration-token-not-registered", "messaging/invalid-registration-token"].includes(err?.code);
```

`sendEachForMulticast` sends to up to 500 tokens in one call and reports per token. The two error codes above mean the app was uninstalled or the token expired; delete those immediately. Everything else, like a quota error, is transient and should not touch the token list.

The service account JSON lives in an environment variable, never in the repository.

## Topics or tokens?

Topics let you send "to everyone subscribed to `announcements`" without listing tokens. They are right for broadcast: a holiday notice, an office closure. They are wrong for anything personal, because anyone with the app can subscribe to any topic name. Leave approvals, salary slips and reminders go to tokens; the all-hands notice goes to a topic.

## Do not notify three times

With three devices, `notifyUser` sends three pushes. That is correct: the person sees it wherever they pick up. What is not correct is sending once per approver action when an approval touches three records. Debounce at the event level: queue notification jobs keyed by `user + event + entityId`, and send once a few seconds later.

```js
await NotificationJob.updateOne(
  { user, key: `leave:${leaveId}:approved` },
  { $setOnInsert: { title, body, path, sendAfter: new Date(Date.now() + 5000) } },
  { upsert: true },
);
```

A worker picks up jobs past `sendAfter`. Duplicates collapse into one document before they ever reach Firebase.

## Deep links

The `data.path` field is what the app opens when the notification is tapped. Keep it a path in your app, not a URL, and have the app route it. A push that opens the app on the home screen instead of the leave it mentions is a push people turn off.

## Testing without annoying the office

A `Device` record with `test: true` flag on your own phone, and an admin-only endpoint that sends a sample to test devices only. Firebase's console can also send a test message to a single token, which is the fastest check that the native setup works at all.

## Sources

- Firebase Admin SDK, send messages: [firebase.google.com/docs/cloud-messaging/send-message](https://firebase.google.com/docs/cloud-messaging/send-message)
- `sendEachForMulticast`: [firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.messaging#messagingsendeachformulticast](https://firebase.google.com/docs/reference/admin/node/firebase-admin.messaging.messaging#messagingsendeachformulticast)
- FCM error codes: [firebase.google.com/docs/cloud-messaging/send-message#admin_sdk_error_reference](https://firebase.google.com/docs/cloud-messaging/send-message#admin_sdk_error_reference)
- Topic messaging: [firebase.google.com/docs/cloud-messaging/manage-topics](https://firebase.google.com/docs/cloud-messaging/manage-topics)
