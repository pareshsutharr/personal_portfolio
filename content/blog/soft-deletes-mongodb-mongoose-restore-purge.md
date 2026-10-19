---
title: "Soft deletes in MongoDB: a deletedAt field, a query filter that is impossible to forget, and a purge job"
description: "An HR manager deleted an employee by mistake, with three years of attendance attached. The restore took a backup and a weekend. Now nothing in the HRMS is deleted; it is marked. The Mongoose plugin that hides deleted rows from every query, the unique-index problem it causes, the restore button, and the job that eventually really deletes."
date: 2028-04-24T03:30:00Z
tags: [mongodb, mongoose, data, hrms, reliability]
keywords: [soft delete mongoose plugin, mongodb deletedAt pattern, soft delete unique index partial, restore deleted record, data retention purge job]
project: growth-avenues-hrms
image: /blog/stock/network-2.webp
imageAlt: "Network cables patched into a switch"
imageCredit: "Inisheer"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:CERN-20060225-01.jpg"
imageLicense: "CC BY-SA 3.0"
summary: "Mark records deleted with a deletedAt field instead of removing them, hide them from every query with a Mongoose plugin, make unique indexes partial so codes can be reused, offer a restore within 30 days, and hard-delete after the retention period with a purge job."
faq:
  - q: "How do I keep deleted rows out of every query automatically?"
    a: "A Mongoose plugin adds deletedAt: null to find, count, update and aggregate hooks unless the query opts out, so developers cannot forget the filter."
  - q: "Why does inserting a reused employee code fail after a soft delete?"
    a: "The deleted document still holds the code in the unique index. Use a partial unique index with partialFilterExpression deletedAt null."
  - q: "Should attendance be deleted when an employee is deleted?"
    a: "No. Leave children attached and hidden by the parent's status; they come back intact on restore and are removed by the purge job at retention end."
---

"Delete" in an HR system should mean "hide, and keep the option to bring back". The employee a manager removed by accident had attendance, leave, salary slips and audit entries hanging off her record, and a hard delete had left half of them orphaned. After the restore, every collection with human-entered data got soft deletes.

## The plugin

```js
export function softDelete(schema) {
  schema.add({ deletedAt: { type: Date, default: null, index: true }, deletedBy: { type: ObjectId, default: null } });

  const notDeleted = function () {
    if (this.getOptions().withDeleted) return;
    const q = this.getFilter();
    if (!("deletedAt" in q)) this.where({ deletedAt: null });
  };
  for (const hook of ["find", "findOne", "countDocuments", "updateOne", "updateMany", "findOneAndUpdate", "aggregate"]) {
    schema.pre(hook, hook === "aggregate" ? function () {
      if (!this.options.withDeleted) this.pipeline().unshift({ $match: { deletedAt: null } });
    } : notDeleted);
  }

  schema.methods.softDelete = function (by) { this.deletedAt = new Date(); this.deletedBy = by; return this.save(); };
  schema.methods.restore = function () { this.deletedAt = null; this.deletedBy = null; return this.save(); };
  schema.statics.findDeleted = function (filter = {}) { return this.find({ ...filter, deletedAt: { $ne: null } }, null, { withDeleted: true }); };
}
```

Every query gets `deletedAt: null` added unless it opts out with `withDeleted: true` or filters on `deletedAt` itself. Aggregations get a `$match` at the front. A developer cannot forget the filter, because they never have to remember it. That is the whole value of a plugin over a convention.

```js
employeeSchema.plugin(softDelete);
await Employee.find({ department });                            // live only
await Employee.find({ department }, null, { withDeleted: true }); // all
await Employee.findDeleted({ department });                     // deleted only, for the trash view
```

## The unique index problem

`code` on employees is unique. Delete `EMP042`, then hire someone new with the same code, and the insert fails on the index because the deleted document still has it. The fix is a partial unique index that only covers live documents:

```js
employeeSchema.index({ code: 1 }, { unique: true, partialFilterExpression: { deletedAt: null } });
```

Now uniqueness applies among non-deleted rows only. Same for `email` on users. This is the detail that most soft-delete tutorials miss and that bites within the first month.

## Deleting is a route with an audit entry

```js
router.delete("/employees/:id", requireRole("hr_admin"), async (req, res) => {
  const emp = await Employee.findOne({ _id: req.params.id });
  if (!emp) throw new HttpError(404, "Not found");
  await emp.softDelete(req.user.id);
  await audit({ action: "delete", collection: "employees", docId: emp._id, actor: req.user });
  res.json({ ok: true, undoUntil: new Date(Date.now() + 30 * 86400_000) });
});
```

The UI responds with "Employee removed. Undo" for ten seconds, and a Trash page lists everything deleted in the last 30 days with a Restore button. Restore is the mirror route calling `restore()`.

## Children stay attached

Attendance for a deleted employee is not deleted. It is hidden by the employee's status in reports, and comes back intact on restore. Deleting children on parent delete, soft or hard, is where the orphan problem started; leaving them alone is simpler and correct.

## The purge

Soft-deleted data does not live forever. Legal retention for the client is seven years for payroll and two for most else. A monthly job hard-deletes what has passed its retention, children included, and records that it did:

```js
export async function purge() {
  const cutoff = new Date(Date.now() - 2 * 365 * 86400_000);
  const victims = await Employee.findDeleted({ deletedAt: { $lt: cutoff } }).select("_id");
  const ids = victims.map((v) => v._id);
  if (ids.length === 0) return;
  await Attendance.deleteMany({ employee: { $in: ids } });
  await Leave.deleteMany({ employee: { $in: ids } });
  await Employee.deleteMany({ _id: { $in: ids } }, { withDeleted: true });
  await audit({ action: "purge", collection: "employees", changes: [{ path: "count", to: ids.length }] });
}
```

Payroll documents have their own, longer cutoff. Without a purge, the database is a graveyard and the retention policy is a lie.

## When not to soft delete

Transient or derived data: sessions, OTPs, cache rows, webhook events after processing, queue jobs. These have TTL indexes and are gone when they expire. Soft deletes are for things a person made and might want back.

## Sources

- Mongoose plugins: [mongoosejs.com/docs/plugins.html](https://mongoosejs.com/docs/plugins.html)
- Mongoose query middleware: [mongoosejs.com/docs/middleware.html#types-of-middleware](https://mongoosejs.com/docs/middleware.html#types-of-middleware)
- MongoDB partial indexes: [mongodb.com/docs/manual/core/index-partial](https://www.mongodb.com/docs/manual/core/index-partial/)
- Indian payroll record retention, Payment of Wages Act rules summary: [labour.gov.in/sites/default/files/the_payment_of_wages_act_1936.pdf](https://labour.gov.in/sites/default/files/the_payment_of_wages_act_1936.pdf)
