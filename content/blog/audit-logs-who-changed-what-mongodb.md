---
title: "Audit logs in a MongoDB app: who changed what, when, and from where"
description: "A salary field changed and nobody knew who did it. That is the day an HRMS needs an audit log. The design I use: one collection, one write per change, diffs not snapshots, a Mongoose plugin so no route forgets, and the retention rule that keeps it from eating the disk."
date: 2027-11-15T03:30:00Z
tags: [mongodb, mongoose, security, hrms, audit]
keywords: [audit log mongodb, mongoose audit trail plugin, track changes who edited record, audit log design node.js, hrms audit trail]
project: growth-avenues-hrms
---

The question arrived as "who changed Rahul's basic salary?" and the honest answer was "the database does not know". Mongoose `timestamps` records *when* a document last changed, not *what* or *by whom*. For an HRMS that is not acceptable, so the next sprint added an audit log. It has answered that question every time since.

## What an audit entry holds

```js
const auditSchema = new Schema({
  at: { type: Date, default: Date.now, index: true },
  actor: { id: ObjectId, name: String, role: String },        // copied, not referenced: names change, logs must not
  action: { type: String, enum: ["create", "update", "delete", "login", "export"], index: true },
  collection: { type: String, index: true },
  docId: { type: ObjectId, index: true },
  changes: [{ path: String, from: Schema.Types.Mixed, to: Schema.Types.Mixed }],
  request: { ip: String, userAgent: String, id: String },
  reason: String,                                             // optional, for sensitive edits
});
auditSchema.index({ collection: 1, docId: 1, at: -1 });
```

Diffs, not snapshots. A snapshot of a 4 KB employee document on every edit grows the collection forty times faster than three changed paths do, and the diff is what people actually read: "basic: 32000 → 38000".

## A Mongoose plugin so nothing is forgotten

An audit log that depends on every route remembering to call `audit()` has gaps where the most interesting edits happen. A plugin on the schema catches document saves:

```js
export function auditPlugin(schema, { collection, redact = [] }) {
  schema.pre("save", function () {
    if (this.isNew) { this.$locals.audit = { action: "create", changes: [] }; return; }
    const changes = this.modifiedPaths({ includeChildren: false })
      .filter((p) => !["updatedAt"].includes(p))
      .map((path) => ({ path, from: redact.includes(path) ? "[redacted]" : this.$__.priorDoc?.[path] ?? this.get(path, null, { getters: false }), to: redact.includes(path) ? "[redacted]" : this.get(path) }));
    this.$locals.audit = { action: "update", changes };
  });

  schema.post("save", async function () {
    const ctx = getRequestContext();                  // AsyncLocalStorage, set by middleware
    const a = this.$locals.audit;
    if (!a || (a.action === "update" && a.changes.length === 0)) return;
    await Audit.create({ actor: ctx?.actor, action: a.action, collection, docId: this._id, changes: a.changes, request: ctx?.request });
  });
}
```

The "from" value needs the document as it was loaded. The simplest reliable way is to capture it in a `post("init")` hook into `this.$__.priorDoc`, which the plugin does above. `redact` keeps bank account numbers and passwords out of the log while still recording that they changed.

## Where the actor comes from

Hooks do not receive `req`. `AsyncLocalStorage` carries it:

```js
import { AsyncLocalStorage } from "node:async_hooks";
export const requestContext = new AsyncLocalStorage();
export const getRequestContext = () => requestContext.getStore();

app.use((req, res, next) => {
  requestContext.run({
    actor: req.user ? { id: req.user.id, name: req.user.name, role: req.user.role } : null,
    request: { ip: req.ip, userAgent: req.get("user-agent"), id: res.getHeader("X-Request-Id") },
  }, next);
});
```

Any code that runs during that request, however deep, can read who is acting.

## The hole: updateOne and findOneAndUpdate

Document middleware does not run for query-based updates. Either route all edits through `findById` then `save`, which is what the HRMS does for anything an admin can touch, or add query hooks that load the document before and after. The first is simpler and fast enough; the update-path trick is reserved for high-volume, low-sensitivity writes like attendance recalculation, which are logged in bulk by the job itself.

## Logins and exports too

An audit trail that only covers edits misses the two events auditors ask about most: who logged in from where, and who exported the salary sheet. Both are explicit `Audit.create` calls in the login handler and the export route, with `action: "login"` or `"export"` and the filter that was exported in `changes`.

## Showing it

Every record page in the admin has a "History" tab: the entries for that `collection` and `docId`, newest first, rendered as "Priya (HR) changed basic from ₹32,000 to ₹38,000 on 3 Mar, 10:42 from 103.x.x.x". A global audit page filters by actor, action and date, for the "what did this person do last week" question.

## Retention

Audit logs must be immutable to be worth anything: no update or delete routes exist for the collection, and the API's database user has no delete permission on it. They also grow. A TTL index of three years on `at` matches the statutory retention the client needed; nightly exports to object storage keep the older entries somewhere cold.

```js
auditSchema.index({ at: 1 }, { expireAfterSeconds: 3 * 365 * 24 * 3600 });
```

## Sources

- Mongoose middleware and the save/query distinction: [mongoosejs.com/docs/middleware.html](https://mongoosejs.com/docs/middleware.html)
- Mongoose `modifiedPaths`: [mongoosejs.com/docs/api/document.html#Document.prototype.modifiedPaths()](https://mongoosejs.com/docs/api/document.html#Document.prototype.modifiedPaths())
- Node `AsyncLocalStorage`: [nodejs.org/api/async_context.html](https://nodejs.org/api/async_context.html)
- MongoDB TTL indexes: [mongodb.com/docs/manual/core/index-ttl](https://www.mongodb.com/docs/manual/core/index-ttl/)
- OWASP logging cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html)
