---
title: "Schema migrations for MongoDB: versioned scripts, a migrations collection, and how to change a field on a million documents"
description: "'Schemaless' does not mean 'never changes shape'. Renaming a field, splitting a name into first and last, backfilling a computed value: each is a migration, and doing them by hand in the shell is how data gets corrupted. The small migration runner I use, the three kinds of migration, and the batched update that does not lock the collection."
date: 2028-04-17T03:30:00Z
tags: [mongodb, migrations, nodejs, database, operations]
keywords: [mongodb migration script node, migrate-mongo alternative, mongodb rename field all documents, mongodb batch update large collection, mongoose schema migration]
project: growth-avenues-hrms
image: /blog/stock/network-1.webp
imageAlt: "Tangle of blue network cables in a rack"
imageCredit: "Unknown"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Cable_closet_bh.jpg"
imageLicense: "Public domain"
---

The HRMS stored employee names as one `name` field for a year. Then the payroll export needed first and last names separately. That is a migration: a one-time, versioned, tested change to the data's shape. Running `db.employees.find().forEach(...)` in a production shell at 4 pm is how a colleague once turned every name into `undefined undefined`. Hence the runner.

## The runner

Forty lines, no framework:

```js
// scripts/migrate.js
import { readdir } from "node:fs/promises";
import { connectDb, db } from "../src/db.js";

await connectDb();
const applied = new Set((await db.collection("_migrations").find().toArray()).map((m) => m._id));
const files = (await readdir("migrations")).filter((f) => f.endsWith(".js")).sort();

for (const file of files) {
  if (applied.has(file)) continue;
  const { up } = await import(`../migrations/${file}`);
  console.log("applying", file);
  const started = Date.now();
  await up(db);
  await db.collection("_migrations").insertOne({ _id: file, appliedAt: new Date(), ms: Date.now() - started });
}
console.log("done");
process.exit(0);
```

Files are named `2028-04-17-split-employee-name.js` so they sort by date. The `_migrations` collection records what ran, so the script is safe to run on every deploy: it only applies what is new. CI runs it against staging on every merge; the deploy script runs it on production before `pm2 reload`.

## The three kinds

**Add a field with a default.** Often no migration is needed: the schema default applies on read for Mongoose, and on write for new documents. When a query needs to filter on the field, a backfill is required so old documents match:

```js
export async function up(db) {
  await db.collection("employees").updateMany({ status: { $exists: false } }, { $set: { status: "active" } });
}
```

**Rename or restructure.** `$rename` for a straight rename. For restructuring, a pipeline update does it server-side without pulling documents into Node:

```js
export async function up(db) {
  await db.collection("employees").updateMany(
    { firstName: { $exists: false }, name: { $type: "string" } },
    [{ $set: {
      firstName: { $arrayElemAt: [{ $split: ["$name", " "] }, 0] },
      lastName: { $trim: { input: { $reduce: { input: { $slice: [{ $split: ["$name", " "] }, 1, 100] }, initialValue: "", in: { $concat: ["$$value", " ", "$$this"] } } } } },
    } }]
  );
}
```

The filter on `firstName: { $exists: false }` makes it re-runnable: if the deploy fails midway, the next run only touches the rest.

**Backfill a computed value.** Worked minutes on 400,000 attendance documents, computed from punches. This one cannot be a single `updateMany`, because the computation is in application code and because one giant update holds locks for too long. Batch it:

```js
export async function up(db) {
  const coll = db.collection("attendance");
  let lastId = null, total = 0;
  for (;;) {
    const batch = await coll.find({ workedMinutes: { $exists: false }, ...(lastId && { _id: { $gt: lastId } }) })
      .sort({ _id: 1 }).limit(1000).toArray();
    if (batch.length === 0) break;
    const ops = batch.map((a) => ({ updateOne: { filter: { _id: a._id }, update: { $set: { workedMinutes: computeMinutes(a) } } } }));
    await coll.bulkWrite(ops, { ordered: false });
    lastId = batch.at(-1)._id;
    total += batch.length;
    if (total % 20000 === 0) console.log("backfilled", total);
    await new Promise((r) => setTimeout(r, 50));      // breathe; let real traffic through
  }
}
```

A thousand at a time, keyed by `_id` so progress is resumable, with a short pause between batches. It ran in nine minutes on production during office hours and nobody noticed.

## Rules that came from mistakes

- **Migrations are forward-only.** `down` functions sound nice and are never tested; a backup before the migration is the rollback.
- **Code must work before and after.** The app reads `firstName ?? name.split(" ")[0]` for one release while the migration runs, then the fallback is removed in the next. Deploy code, run migration, deploy cleanup.
- **Dry-run on a copy of production.** The staging refresh post has the dump-and-restore. Run the migration there, check counts, then production.
- **Count before and after.** `countDocuments` on the filter before, zero after. Print both.
- **Never a migration in Mongoose hooks or app startup.** Startup must be fast and must not change data; a migration is an explicit step a human triggers or CI triggers.

## Sources

- MongoDB updates with aggregation pipelines: [mongodb.com/docs/manual/tutorial/update-documents-with-aggregation-pipeline](https://www.mongodb.com/docs/manual/tutorial/update-documents-with-aggregation-pipeline/)
- `bulkWrite`: [mongodb.com/docs/manual/reference/method/db.collection.bulkWrite](https://www.mongodb.com/docs/manual/reference/method/db.collection.bulkWrite/)
- `$rename`: [mongodb.com/docs/manual/reference/operator/update/rename](https://www.mongodb.com/docs/manual/reference/operator/update/rename/)
- migrate-mongo, if you want a framework: [github.com/seppevs/migrate-mongo](https://github.com/seppevs/migrate-mongo)
- Expand and contract pattern: [martinfowler.com/bliki/ParallelChange.html](https://martinfowler.com/bliki/ParallelChange.html)
