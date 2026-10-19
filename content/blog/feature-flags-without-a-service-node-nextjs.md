---
title: "Feature flags without a flag service: a table, a cached read, and a rollout you can undo in ten seconds"
description: "The new leave approval flow went live for one department first, then three, then everyone, and could have been switched off in seconds at any point. No third-party flag service, no SDK: a flags table, a sixty-second cache, a per-user and per-group override, and a page in the admin. The schema, the helper, how it is used in Express and in Next.js server components, and when to graduate to a real service."
date: 2028-07-24T03:30:00Z
tags: [feature-flags, nodejs, nextjs, deployment, product]
keywords: [feature flags without launchdarkly, simple feature flag implementation node, gradual rollout feature flag database, feature flag next.js server component, kill switch feature flag]
project: growth-avenues-hrms
image: /blog/stock/team-1.webp
imageAlt: "Man working at a laptop in an office"
imageCredit: "Bench Accounting benchaccounting"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Man_at_a_laptop_in_an_office_(Unsplash).jpg"
imageLicense: "CC0"
---

Deploying code and releasing a feature should be two different events. The HRMS learned that the hard way when a new approval flow went to everyone at once and a rule nobody had tested on multi-level approvals stalled forty requests. The flow is now behind a flag, and so is every change that touches a workflow people depend on.

## The table

```js
const flagSchema = new Schema({
  key: { type: String, unique: true },            // "leave.newApprovalFlow"
  description: String,
  enabled: { type: Boolean, default: false },     // global switch
  percentage: { type: Number, default: 100 },     // of users, when enabled
  allowUsers: [ObjectId],                         // always on for these
  allowGroups: [String],                          // always on for these departments/roles
  denyUsers: [ObjectId],                          // always off
  updatedBy: ObjectId,
}, { timestamps: true });
```

One document per flag. The admin has a page listing them with toggles and a text box for groups, and every change is audit-logged like any other edit.

## The helper

```js
const cache = new Map();
let loadedAt = 0;

async function allFlags() {
  if (Date.now() - loadedAt > 60_000) {
    const rows = await Flag.find().lean();
    cache.clear(); for (const r of rows) cache.set(r.key, r);
    loadedAt = Date.now();
  }
  return cache;
}

export async function isEnabled(key, ctx = {}) {
  const f = (await allFlags()).get(key);
  if (!f) return false;                                                   // unknown flag: off
  if (ctx.userId && f.denyUsers.some((id) => id.equals(ctx.userId))) return false;
  if (ctx.userId && f.allowUsers.some((id) => id.equals(ctx.userId))) return true;
  if (ctx.groups?.some((g) => f.allowGroups.includes(g))) return true;
  if (!f.enabled) return false;
  if (f.percentage >= 100) return true;
  return bucket(key, ctx.userId) < f.percentage;
}

function bucket(key, userId) {                                          // stable 0–99 per user per flag
  const h = crypto.createHash("sha1").update(`${key}:${userId}`).digest();
  return h.readUInt16BE(0) % 100;
}
```

One query a minute per process, whatever the traffic. The bucket is a hash of flag and user, so a person at 30% stays in or out consistently rather than flickering between requests, and different flags roll out to different subsets.

## In Express

```js
router.post("/leave", requireAuth, validate(leaveSchema), async (req, res) => {
  const useNew = await isEnabled("leave.newApprovalFlow", { userId: req.user.id, groups: [req.user.department, req.user.role] });
  const result = useNew ? await submitLeaveV2(req) : await submitLeaveV1(req);
  res.json(result);
});
```

Both paths exist in the codebase during the rollout. That is the cost of a flag: the old code stays until the flag reaches 100% and stays there for a couple of weeks, after which the flag and the old path are removed in the same pull request. A flag older than a quarter is a bug.

## In Next.js server components

```tsx
export default async function LeavePage() {
  const user = await requireUser();
  const newFlow = await isEnabled("leave.newApprovalFlow", { userId: user.id, groups: [user.department] });
  return newFlow ? <LeaveFormV2 /> : <LeaveFormV1 />;
}
```

Evaluated on the server, so the client never receives the code for the variant it does not get, and the flag cannot be flipped from dev tools. For client components that need to know, the value is passed down as a prop from the server component that read it.

## The rollout that worked

1. Flag created, disabled. Code deployed with both paths. Nothing changes.
2. `allowGroups: ["IT"]`. The six people in IT use the new flow for a week and report two bugs.
3. `allowGroups: ["IT", "Finance", "HR"]`. Another week.
4. `enabled: true, percentage: 25`, then 50, then 100 over ten days.
5. Two weeks at 100%. Old path deleted, flag deleted.

At step 3 a bug in the half-day calculation came up and the flag was turned off for Finance in ten seconds, fixed the next day, and turned back on. No deploy, no rollback, nobody else affected.

## Kill switches

Some flags never reach "delete": `integrations.biometricSync`, `email.sendTransactional`, `reports.heavyExports`. They are the off switches for things that depend on outside systems. When the SMS provider had an outage, `otp.sms` went off and the login page said "use your authenticator app" until it was back.

## When to use a service

A hosted flag service earns its cost when there are several applications sharing flags, when non-engineers need scheduling and experiment analytics, or when flags must evaluate in the browser without a server round trip. For a product with one API, one web app and one admin, the table above has done the job for two years and costs nothing.

## Sources

- Martin Fowler on feature toggles: [martinfowler.com/articles/feature-toggles.html](https://martinfowler.com/articles/feature-toggles.html)
- Pete Hodgson's toggle categories, release vs ops vs permission: same article, "Categories of toggles"
- OpenFeature, a vendor-neutral spec if you want an abstraction: [openfeature.dev](https://openfeature.dev/)
- Trunk-based development and flags: [trunkbaseddevelopment.com/feature-flags](https://trunkbaseddevelopment.com/feature-flags/)
