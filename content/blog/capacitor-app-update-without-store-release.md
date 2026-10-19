---
title: "Updating a Capacitor app without a store release"
description: "Growth HR's web layer changes every week; its native shell changes twice a year. Here is how the app loads the current web build without a Play Store or App Store review, what the store rules allow, and the two things that still require a release."
date: 2027-06-28T03:30:00Z
tags: [capacitor, mobile, android, ios, deployment]
keywords: [capacitor live update, update capacitor app without app store, capacitor remote web bundle, ota update hybrid app, capacitor server url]
project: growth-avenues-hrms
image: /blog/stock/chat-3.webp
imageAlt: "Woman texting on a smartphone"
imageCredit: "Kristin Hardwick"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Woman_texting_on_a_smartphone.jpg"
imageLicense: "CC0"
---

An HRMS changes constantly: a new leave type, a fixed label, a report. Shipping each of those through app store review would mean a week between the fix and the phone. Because a Capacitor app is a web app in a native shell, there are two ways to update the web part on its own. One is trivial and limited; the other is a little more work and what Growth HR uses.

## What the stores allow

Both Apple and Google permit updating the JavaScript and HTML an app runs, as long as it does not change the app's core purpose or load code that bypasses review for native features. Updating your own web app's screens is squarely within that. Loading a different app is not. Keep the update to your bundle and you are fine.

## Option 1: point the shell at your server

The simplest version: the native app loads the web app from a URL instead of from its own bundle.

```ts
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: "com.growthavenues.hr",
  appName: "Growth HR",
  webDir: "dist",
  server: { url: "https://app.growthavenues.in", cleartext: false },
};
```

Every launch gets whatever is deployed. Deploy the web build, and every phone has it on next open.

The costs: the app needs a network connection to start at all, the first paint waits on the network, and if the server is down the app shows an error page. For an internal tool used on office Wi-Fi that was almost acceptable. Almost.

## Option 2: bundled app, downloaded updates

The shell ships with a web build inside, so it starts instantly and offline. On launch it checks a manifest; if a newer build exists, it downloads the zip in the background, verifies it, and switches to it on the next start.

The mechanics with Capacitor's community live-update plugin (or Capgo, which is the hosted version of the same idea):

```ts
import { CapacitorUpdater } from "@capgo/capacitor-updater";

// on app start
CapacitorUpdater.notifyAppReady();          // marks the current bundle good; a crash before this rolls back

// check for a new build
const current = await CapacitorUpdater.current();
const manifest = await (await fetch("https://app.growthavenues.in/mobile/manifest.json")).json();
if (manifest.version !== current.bundle.version) {
  const bundle = await CapacitorUpdater.download({ url: manifest.url, version: manifest.version });
  await CapacitorUpdater.next({ id: bundle.id });   // apply on next launch, not mid-session
}
```

The deploy side publishes a zip of `dist/` and a manifest with the version and URL. `notifyAppReady` is the safety: if the new bundle crashes before calling it, the plugin rolls back to the previous one automatically. That rollback saved a Monday morning once.

## Keep API and app compatible

A downloaded web build may be a week newer than the API, or, on a phone that was off, a month older. Rules that keep this safe:

- The API never removes a field; it adds. Removal happens one release after nothing uses it.
- The web build sends its version in a header: `X-App-Version: 2027.06.3`. The API logs it, and can refuse builds below a minimum with a clear "please update" response.
- Breaking changes go through the native release path, where the store forces the update.

## What still needs a store release

1. **Native plugins.** A new plugin, or a plugin update with native code, changes the shell.
2. **Permissions and capabilities.** Adding camera access or push notifications changes the manifest and entitlements.

Growth HR has had two store releases in a year for those reasons, and about forty web updates in between.

## Sources

- Capacitor configuration, `server.url`: [capacitorjs.com/docs/config](https://capacitorjs.com/docs/config)
- Capgo updater plugin: [github.com/Cap-go/capacitor-updater](https://github.com/Cap-go/capacitor-updater)
- Apple App Store Review Guidelines, section 2.5.2 on executable code: [developer.apple.com/app-store/review/guidelines](https://developer.apple.com/app-store/review/guidelines/#software-requirements)
- Google Play policy on code execution: [support.google.com/googleplay/android-developer/answer/9888379](https://support.google.com/googleplay/android-developer/answer/9888379)
