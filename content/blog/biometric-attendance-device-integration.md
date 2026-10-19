---
title: "Biometric attendance integration: polling a device API without losing punches"
description: "Fingerprint devices at the office log punches locally and expose them over the network. Getting those into the HRMS reliably, across power cuts and clock drift, took a polling design with checkpoints, idempotent writes, and a reconciliation report HR actually reads."
date: 2027-08-09T03:30:00Z
tags: [integration, hrms, nodejs, mongodb, hardware]
keywords: [biometric device api integration, attendance device sync node.js, essl zkteco integration, idempotent sync design, fingerprint attendance hrms]
project: biometric-attendance-integration
image: /blog/stock/fingerprint-2.webp
imageAlt: "Fingerprint scanner device on a desk"
imageCredit: "Harrison Keely"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:A_fingerprint_scanner_at_a_prison_or_jail_in_the_United_States.jpg"
imageLicense: "CC BY 4.0"
summary: "Poll each fingerprint device from a checkpoint of the last punch seen, write punches idempotently keyed by device, user and timestamp, correct for device clock drift, and run a nightly reconciliation that re-pulls the day. Power cuts and drift are normal, not exceptions."
faq:
  - q: "How do I avoid losing punches when the device loses power?"
    a: "Devices store punches locally. Poll from a saved checkpoint rather than from now, so everything logged while the link was down is fetched afterwards."
  - q: "Why do the same punches appear twice?"
    a: "Overlapping polls or retries. Make writes idempotent with a unique index on device, user id and punch time so duplicates are ignored."
  - q: "What if the device clock is wrong?"
    a: "Record the device's reported time and the server time on each poll, compute the offset, and correct punches; alert when drift passes a threshold."
---

The biometric devices on office walls are small computers with a fingerprint sensor and a log. Most of them, from the common vendors, expose that log over the local network, either through a vendor SDK, a push protocol, or a plain HTTP or TCP interface. The HRMS needs those punches. The design below has survived two years, a device replacement and several power cuts.

## Pull, do not trust push alone

Some devices can push punches to a URL as they happen. It is tempting and it is not enough: when the server is down for a deploy, pushed punches are lost or, depending on the firmware, retried in surprising ways. The HRMS pulls on a schedule and treats push as a hint to pull sooner.

```js
cron.schedule("*/5 * * * *", () => syncAll().catch(log.error), { timezone: "Asia/Kolkata" });
```

## Checkpoints per device

Each device record stores the last punch time the server has, and the sync asks for everything after it with an overlap:

```js
async function syncDevice(device) {
  const since = new Date(device.lastPunchAt.getTime() - 10 * 60 * 1000); // 10 min overlap
  const punches = await deviceClient.fetchLogs(device, { since });        // vendor-specific
  for (const p of punches) await recordPunch(device, p);
  const newest = punches.reduce((m, p) => (p.at > m ? p.at : m), device.lastPunchAt);
  await Device.updateOne({ _id: device.id }, { lastPunchAt: newest, lastSyncAt: new Date(), lastError: null });
}
```

The overlap means a punch that arrived at the device during the previous sync's fetch is picked up next time. That only works if recording is idempotent, so:

## Idempotent writes

A punch is identified by device, employee and the device's own timestamp. Insert with a unique index and ignore duplicates:

```js
punchSchema.index({ device: 1, deviceUserId: 1, deviceTime: 1 }, { unique: true });

async function recordPunch(device, p) {
  const employee = await Employee.findOne({ biometricIds: `${device.id}:${p.userId}` }).select("_id").lean();
  try {
    await Punch.create({
      device: device.id, deviceUserId: p.userId, deviceTime: p.at,
      employee: employee?._id ?? null,
      at: p.at,
      day: formatInTimeZone(p.at, "Asia/Kolkata", "yyyy-MM-dd"),
      source: "biometric",
    });
    if (employee) await enqueueRecalc(employee._id, p.day);
  } catch (err) {
    if (err.code !== 11000) throw err;          // 11000 = duplicate key: already have it
  }
}
```

Fetching the same window twice, or a hundred times, produces the same set of punches. That property is what makes everything else forgiving.

## Clock drift

Device clocks drift, sometimes by minutes a month, and nobody adjusts them. The sync compares the device's reported time with the server's on every run and records the offset. Beyond two minutes, it logs a warning and the device appears in the admin with "clock off by 4 min". Punches keep the device's time, because that is what the employee saw on the screen, and the offset is stored alongside for anyone who needs to reason about it later.

## Unmapped fingerprints

A new joiner enrols on the device before HR links the device user id to an employee. Their punches arrive with `employee: null`. The admin lists unmapped device users with their punch counts; mapping one backfills `employee` on its existing punches and triggers recalculation. Nothing is lost while the paperwork catches up.

## Reconciliation, the part HR reads

A daily report at 7 pm: per device, punches received today, last sync time, last error, unmapped users. Per employee, days with a single punch (forgot to punch out) and days with punches on a device at a different branch than their own. Two of those rows per week turn into real conversations; the rest confirm the system is alive. Before this report existed, a device that had been offline for three days was discovered on payroll day.

## Vendor specifics

The device client is one module per vendor behind the same `fetchLogs(device, { since })` interface. ZKTeco-style devices talk a binary protocol over TCP for which open-source clients exist; others expose HTTP with basic auth; a few only have a Windows SDK, in which case a small Windows service exports logs to a shared folder the sync reads. The interface stays the same; the ugliness stays in one file per vendor.

## Sources

- node-cron: [github.com/node-cron/node-cron](https://github.com/node-cron/node-cron)
- MongoDB unique indexes and duplicate key errors: [mongodb.com/docs/manual/core/index-unique](https://www.mongodb.com/docs/manual/core/index-unique/)
- Idempotency, explained in the context of APIs: [stripe.com/docs/api/idempotent_requests](https://stripe.com/docs/api/idempotent_requests)
- An open-source ZKTeco protocol client for Node, as an example of the vendor layer: [github.com/caobo171/node-zklib](https://github.com/caobo171/node-zklib)
