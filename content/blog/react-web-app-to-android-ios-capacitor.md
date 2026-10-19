---
title: "Turning a React web app into an Android and iOS app with Capacitor"
description: "How Growth HR, the employee app for the Growth Avenues HRMS, became a native app without a rewrite: Capacitor around the existing React build, Firebase push notifications, and the handful of things that are different on a phone."
date: 2026-11-16T03:30:00Z
tags: [capacitor, react, android, ios, firebase, mobile]
keywords: [capacitor react app android ios, convert react web app to mobile app, capacitor push notifications firebase, capacitor vs react native, pwa to app store]
project: growth-avenues-hrms
---

The Growth Avenues HRMS started as a web portal: attendance, leave, expenses, salary slips. Then the team wanted it on their phones, with notifications when a leave request was approved. The obvious answer was "rewrite it in React Native". The right answer, for a working React app and a team of one, was Capacitor.

Capacitor wraps your built web app in a native shell and gives it a JavaScript bridge to device features. The app you ship to the Play Store and the App Store is your existing React code, plus a few plugins. Growth HR went from decision to store listing in about three weeks, most of which was store paperwork.

## When Capacitor is the right call

- You already have a responsive web app that works well on phone screens.
- You need a store presence, push notifications, or a home-screen icon that opens full screen.
- You do not need heavy native UI, maps that must be native, or 60 fps gestures everywhere.

If any screen needs to feel like a truly native list with native transitions, React Native or Flutter is the better tool. For a forms-and-lists business app, Capacitor is faster to ship and easier to keep in sync with the web version, because it is the web version.

## Setup

In the existing React project:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init "Growth HR" com.growthavenues.hr --web-dir=dist
npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

Build the web app, copy it into the native projects, and open them:

```bash
npm run build
npx cap sync
npx cap open android   # Android Studio
npx cap open ios       # Xcode, Mac only
```

`cap sync` is the command you will run a hundred times. It copies the build into both native projects and installs plugin native code.

## Point the app at your API

The web build normally calls relative URLs like `/api/leave`. Inside the app there is no server behind the page, so every API call must be absolute. One environment variable fixes it:

```ts
export const API_BASE = import.meta.env.VITE_API_BASE ?? "";
fetch(`${API_BASE}/api/leave`);
```

Set `VITE_API_BASE=https://hrms.growthavenues.in` for the app build. Also make sure the API's CORS allows the app's origin, which is `capacitor://localhost` on iOS and `http://localhost` on Android.

## Push notifications with Firebase

This is the feature that justified the whole project. The flow is: the app asks for permission and gets a device token, you store the token against the user, and your server sends to that token through Firebase Cloud Messaging when something happens.

```bash
npm install @capacitor/push-notifications
npx cap sync
```

```ts
import { PushNotifications } from "@capacitor/push-notifications";

export async function registerForPush(saveToken: (t: string) => Promise<void>) {
  const perm = await PushNotifications.requestPermissions();
  if (perm.receive !== "granted") return;
  await PushNotifications.register();
  PushNotifications.addListener("registration", ({ value }) => saveToken(value));
  PushNotifications.addListener("pushNotificationActionPerformed", ({ notification }) => {
    const path = notification.data?.path;
    if (path) window.location.assign(path); // deep link into the app
  });
}
```

On the server, with the Firebase Admin SDK:

```js
import admin from "firebase-admin";
await admin.messaging().send({
  token: user.pushToken,
  notification: { title: "Leave approved", body: "Your leave for 3 Nov was approved." },
  data: { path: "/leaves" },
});
```

Android needs `google-services.json` from the Firebase console in `android/app/`. iOS needs an APNs key uploaded to Firebase and the Push Notifications capability turned on in Xcode. Both are documented step by step in the Capacitor plugin docs linked below; follow them exactly, the order matters.

## Things that are different in the app

- **The status bar.** Content renders under it by default. Use `@capacitor/status-bar` to set a dark style, and add top padding with `env(safe-area-inset-top)` in CSS.
- **The back button on Android.** It closes the app by default. Listen for it with `@capacitor/app` and call `history.back()` unless you are on the home screen.
- **External links.** `window.open` opens inside the app shell. Use `@capacitor/browser` to open them properly.
- **Cookies.** Auth cookies behave differently across the native origin. I switched the app to the bearer-token flow I described in the JWT post and stored the refresh token with `@capacitor/preferences`.
- **Keyboard.** On iOS the keyboard can cover inputs. `@capacitor/keyboard` with `resize: "body"` in `capacitor.config.ts` handles most of it.

## Shipping

Android: in Android Studio, Build, Generate Signed Bundle, upload the `.aab` to Play Console. Keep the signing keystore somewhere safe; losing it means you can never update the app.

iOS: in Xcode, Product, Archive, then upload through the Organizer. You need an Apple Developer account, and the first review takes a few days.

For both stores you need a privacy policy URL. Growth HR's is a plain page on its own small site. Do not skip this; it is the most common rejection reason for business apps.

## Keeping web and app in sync

Because the app is the web build, every feature ships to both. My release list is: build, `cap sync`, test on one Android and one iPhone, bump the version in both native projects, upload. The web deploy goes out the same day. The team gets one product on three surfaces, and I maintain one codebase.

## Sources

- Capacitor docs: [capacitorjs.com/docs](https://capacitorjs.com/docs)
- Push Notifications plugin, including the Firebase and APNs setup: [capacitorjs.com/docs/apis/push-notifications](https://capacitorjs.com/docs/apis/push-notifications)
- Firebase Admin SDK, sending messages: [firebase.google.com/docs/cloud-messaging/send-message](https://firebase.google.com/docs/cloud-messaging/send-message)
- Play Console app signing: [support.google.com/googleplay/android-developer/answer/9842756](https://support.google.com/googleplay/android-developer/answer/9842756)
