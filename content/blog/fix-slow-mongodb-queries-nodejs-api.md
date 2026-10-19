---
title: "Fixing slow MongoDB queries in a Node.js API"
description: "The checklist I used to bring the Growth Avenues API's slowest endpoints down from seconds to milliseconds: explain(), the right indexes, projections, lean(), and knowing when the problem is not the database at all."
date: 2026-11-02T03:30:00Z
tags: [mongodb, mongoose, nodejs, performance]
keywords: [slow mongodb query, mongodb explain executionStats, mongoose lean performance, mongodb compound index order, node api slow response]
project: growth-avenues
---

When the distributor list on Growth Avenues started taking three to four seconds, the first guess from everyone was "the server is too small". It was not. The server was idle. The database was scanning every document in a collection for every request. Here is the order I check things in now, because it has found the problem every time since.

## 1. Measure before touching anything

Find the slow endpoint, then find the query behind it. In Mongoose, turn on debug logging for a minute:

```js
mongoose.set("debug", true);
```

Copy the query it prints and run it in the shell with `explain`:

```js
db.clients.find({ distributor: ObjectId("...") , status: "active" })
  .sort({ createdAt: -1 })
  .explain("executionStats")
```

Three numbers tell the story:

- `totalDocsExamined`: how many documents MongoDB looked at.
- `nReturned`: how many it returned.
- `executionTimeMillis`: how long it took.

If `totalDocsExamined` is in the tens of thousands and `nReturned` is forty, you have a collection scan. `winningPlan.stage` will say `COLLSCAN`. That was my case: 60,000 examined, 38 returned, 2,900 ms.

## 2. Add the index the query actually wants

The rule for compound indexes is equality fields first, then the sort field, then range fields. For the query above:

```js
clientSchema.index({ distributor: 1, status: 1, createdAt: -1 });
```

Rerun `explain`. The stage becomes `IXSCAN`, `totalDocsExamined` drops to the same as `nReturned`, and the time drops to single digits. That one line took the endpoint from 2.9 seconds to 11 ms.

Two cautions. Every index slows writes a little and takes memory, so do not index every field "just in case". And index order matters: `{ status: 1, distributor: 1 }` is a different index and would not fully serve this query's sort.

## 3. Ask for less

Mongoose returns full documents with getters, virtuals and change tracking. For read-only lists, none of that is needed.

```js
const clients = await Client.find(filter)
  .select("name email status createdAt")   // projection
  .sort({ createdAt: -1 })
  .limit(50)
  .lean();                                 // plain objects, no hydration
```

`lean()` alone made a 3,000-row export about four times faster in my measurements, because Mongoose was no longer building 3,000 model instances. `select` cuts the bytes crossing the network, which matters more than people expect when documents carry big nested arrays.

## 4. Stop paginating with skip

`skip(10000).limit(50)` still walks the first 10,000 index entries. Page 200 is slower than page 1 and it gets worse forever. Use a cursor on the sort key instead:

```js
// first page
Client.find(filter).sort({ _id: -1 }).limit(50);
// next page: pass the last _id you showed
Client.find({ ...filter, _id: { $lt: lastId } }).sort({ _id: -1 }).limit(50);
```

Every page costs the same.

## 5. Look for the N+1

A list of 50 clients that then does `await Distributor.findById(client.distributor)` inside a loop is 51 queries. Use `populate` with a field list, or better, fetch the distributors in one query with `$in` and join in memory:

```js
const ids = [...new Set(clients.map((c) => String(c.distributor)))];
const distributors = await Distributor.find({ _id: { $in: ids } }).select("name").lean();
const byId = new Map(distributors.map((d) => [String(d._id), d]));
```

The middleware layer on Growth Avenues had one of these hiding in an audit-log helper. It was called on every request and nobody had noticed because each individual call was fast.

## 6. Check it is not the connection

If `explain` says 5 ms and the endpoint still takes 400 ms, the time is somewhere else. Common suspects:

- A new database connection per request. Connect once at startup and reuse it; Mongoose does this if you call `mongoose.connect` once.
- The database in another region. Atlas in Mumbai with a server in Bengaluru is fine; Atlas in Virginia with a server in India adds a round trip of 200 ms to every query.
- Doing something slow after the query, like generating a PDF or calling a third-party API synchronously.

Wrap the query and the handler separately in `console.time` labels for a few minutes and the split shows itself.

## The habit that prevents all of this

Before merging any new list endpoint, I run its query through `explain("executionStats")` once and write the index in the same commit as the route. It takes two minutes and it is the only reason the API has stayed fast as the data grew.

## Sources

- `explain` output explained: [mongodb.com/docs/manual/reference/explain-results](https://www.mongodb.com/docs/manual/reference/explain-results/)
- The ESR (equality, sort, range) rule for compound indexes: [mongodb.com/docs/manual/tutorial/equality-sort-range-rule](https://www.mongodb.com/docs/manual/tutorial/equality-sort-range-rule/)
- Mongoose `lean()`: [mongoosejs.com/docs/tutorials/lean.html](https://mongoosejs.com/docs/tutorials/lean.html)
- Why `skip` is slow and how to paginate with a range: [mongodb.com/docs/manual/reference/method/cursor.skip](https://www.mongodb.com/docs/manual/reference/method/cursor.skip/)
