---
title: "A lead desk in a back office: statuses, assignment, and not losing enquiries"
description: "Account-opening requests and contact enquiries for Growth Avenues used to land in an inbox and get lost. The lead desk I built in the admin is small: five statuses, an owner, notes, and a rule that nothing can sit untouched for more than two days."
date: 2027-03-01T03:30:00Z
tags: [crm, admin, mongodb, react, product]
keywords: [build crm lead management, lead pipeline statuses, lead assignment admin panel, contact form leads database, simple crm node react]
project: growth-avenues-admin
---

Before the lead desk existed, an "Open your account" form on the Growth Avenues site sent an email. Three people received it. Each assumed another would reply. Some leads waited a week; a few were never answered. The fix was not a bigger CRM. It was a table with a status, an owner, and a nagging dashboard.

## The data

```js
const leadSchema = new Schema({
  source: { type: String, enum: ["account_opening", "contact", "callback"], required: true },
  name: String, phone: String, email: String, city: String,
  message: String,
  status: { type: String, enum: ["new", "contacted", "in_progress", "converted", "closed"], default: "new", index: true },
  owner: { type: Schema.Types.ObjectId, ref: "User", index: true },
  priority: { type: String, enum: ["normal", "high"], default: "normal" },
  lastActivityAt: { type: Date, default: Date.now, index: true },
  notes: [{ by: { type: Schema.Types.ObjectId, ref: "User" }, text: String, at: { type: Date, default: Date.now } }],
  ipHash: String,
}, { timestamps: true });
```

Five statuses, no more. Every proposal for a sixth was really a note. `lastActivityAt` is the field the whole system turns on: it updates on any status change, note or assignment, and it is what the "stale" rule reads.

## The rule that made it work

A lead with `status: "new"` for more than 24 hours, or any open lead with no activity for 48 hours, shows at the top of the dashboard in red with the owner's name. That is the entire enforcement mechanism. Nobody wants their name in the red list in front of the team.

```js
const stale = await Lead.find({
  status: { $in: ["new", "contacted", "in_progress"] },
  $or: [
    { status: "new", createdAt: { $lt: hoursAgo(24) } },
    { lastActivityAt: { $lt: hoursAgo(48) } },
  ],
}).populate("owner", "name").sort({ lastActivityAt: 1 }).limit(20).lean();
```

## Assignment

New leads auto-assign round-robin among people with the sales role, and anyone can reassign with a reason that becomes a note. Auto-assignment was the second most important decision after the stale rule: an unowned lead is everyone's and therefore nobody's.

```js
async function nextOwner() {
  const reps = await User.find({ role: "sales", active: true }).sort({ _id: 1 }).select("_id").lean();
  const last = await Lead.findOne({ owner: { $ne: null } }).sort({ createdAt: -1 }).select("owner").lean();
  const i = last ? reps.findIndex((r) => String(r._id) === String(last.owner)) : -1;
  return reps[(i + 1) % reps.length]?._id ?? null;
}
```

## The screen

One list, filtered by status tabs with counts, sorted by `lastActivityAt` ascending so the neglected ones are on top. Clicking a row opens a side panel: the enquiry, a status select, an owner select, and the notes thread with a textarea. No modal, no separate page; the list stays visible so the next lead is one click away.

Phone numbers are `tel:` links and emails are `mailto:` links, which sounds trivial and removed about thirty seconds of copying from every follow-up.

## What comes from the public site

The contact and account forms insert leads through the API with the secret key, after a honeypot and a per-IP limit, and store a hash of the IP rather than the IP. The form posts the page it was submitted from as `source`, so the team knows whether someone came from the mutual fund page or the broking page. That one field changed how they open the call.

## Reporting that people actually read

- Leads per week by source.
- Median time from `new` to `contacted`, which went from days to under four hours after the stale rule.
- Conversion by owner, monthly.

Each is one aggregation and one chart. I resisted a dashboard with twelve widgets; three numbers the team recognises beat twelve they ignore.

## Sources

- MongoDB aggregation for reporting: [mongodb.com/docs/manual/aggregation](https://www.mongodb.com/docs/manual/aggregation/)
- Mongoose timestamps and subdocuments: [mongoosejs.com/docs/guide.html#timestamps](https://mongoosejs.com/docs/guide.html#timestamps)
- `tel:` and `mailto:` links on MDN: [developer.mozilla.org/en-US/docs/Web/HTML/Element/a#linking_to_telephone_numbers](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/a#linking_to_telephone_numbers)
