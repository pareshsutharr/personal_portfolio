---
title: "Adding an index to a busy MongoDB collection without taking the app down"
description: "The attendance collection had 400,000 documents and a new report needed an index it did not have. Building it the naive way would have blocked writes during office hours. How index builds work in current MongoDB, how to run one safely, how to watch it, and how to remove an index you are no longer sure about."
date: 2028-01-03T03:30:00Z
tags: [mongodb, performance, database, operations]
keywords: [mongodb create index without downtime, mongodb background index build, mongodb index build progress, mongodb hidden index, mongodb drop index safely]
project: growth-avenues-hrms
---

A new "late arrivals by department" report needed an index on `{ department: 1, day: 1, status: 1 }` across the attendance collection. The collection was the busiest in the HRMS, with a write every few seconds from the biometric sync. The question was whether creating the index would stall those writes, and for how long.

## How index builds behave now

Since MongoDB 4.2, index builds use an optimised process that holds an exclusive lock only briefly at the start and end. In between, reads and writes to the collection continue. The old `background: true` option is ignored because every build now behaves that way. So on a modern version the build is not the blocking event it was, and what matters is the resources it uses.

On a replica set, the build runs on all members at once and commits when they all finish. On a standalone, it just runs.

## Running it

```js
db.attendance.createIndex(
  { department: 1, day: 1, status: 1 },
  { name: "dept_day_status" }
)
```

Name every index. Auto-generated names like `department_1_day_1_status_1` are fine until a field renames, and a named index is easier to refer to in a migration script.

For the 400,000-document attendance collection the build took about forty seconds and disk I/O rose noticeably. Writes slowed; none failed. On the next, larger project the build ran at 2 am from a scheduled script, which is the sensible default for anything over a few million documents.

## Watching it

```js
db.currentOp({ "command.createIndexes": { $exists: true } })
// look at "progress": { done: 213000, total: 400000 } and "msg"
```

And in the shell, `db.attendance.getIndexes()` shows the new index once it is complete. If a build must be stopped, `db.killOp(opid)` aborts it cleanly and leaves no partial index.

## Check it is actually used

Before telling anyone the report is fast:

```js
db.attendance.find({ department: deptId, day: { $gte: "2028-01-01" }, status: "late" })
  .explain("executionStats").executionStats
// totalDocsExamined should be close to nReturned; stage should be IXSCAN
```

The first version of this index had `status` before `day` and the planner used it for the equality on `status` but then scanned every day. Reordering to put the range field last fixed it: equality fields first, then sort fields, then range fields.

## Removing an index you are not sure about

Dropping an index that a query still relies on turns a 20 ms request into a 4 second one at the worst time. Hide it first:

```js
db.attendance.hideIndex("old_dept_only")
// watch slow query logs and response times for a week
db.attendance.dropIndex("old_dept_only")
```

A hidden index is maintained but ignored by the planner. If something slows down, `unhideIndex` is instant; a dropped index would need a rebuild. Index usage stats help decide which ones to try:

```js
db.attendance.aggregate([{ $indexStats: {} }]).forEach(s => print(s.name, s.accesses.ops))
```

An index with zero operations since the last restart is a candidate. One that costs write performance and serves one monthly report may be a candidate too.

## In a migration, not the shell

Production indexes are declared in code, so staging and production match and a new deployment gets them:

```js
// migrations/2028-01-03-attendance-dept-index.js
export async function up(db) {
  await db.collection("attendance").createIndex({ department: 1, day: 1, status: 1 }, { name: "dept_day_status" });
}
```

Mongoose's `autoIndex` does the same on startup for schema-level indexes, and that is fine for small collections. For the big ones it is off in production, because an unplanned index build on a deploy at 10 am is exactly the thing this post is trying to avoid.

## Sources

- MongoDB index builds on populated collections: [mongodb.com/docs/manual/core/index-creation](https://www.mongodb.com/docs/manual/core/index-creation/)
- Hidden indexes: [mongodb.com/docs/manual/core/index-hidden](https://www.mongodb.com/docs/manual/core/index-hidden/)
- `$indexStats`: [mongodb.com/docs/manual/reference/operator/aggregation/indexStats](https://www.mongodb.com/docs/manual/reference/operator/aggregation/indexStats/)
- The ESR guideline for compound indexes: [mongodb.com/docs/manual/tutorial/equality-sort-range-guideline](https://www.mongodb.com/docs/manual/tutorial/equality-sort-range-guideline/)
- Mongoose `autoIndex`: [mongoosejs.com/docs/guide.html#indexes](https://mongoosejs.com/docs/guide.html#indexes)
