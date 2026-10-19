---
title: "Search in a CRM: MongoDB text index, Atlas Search, or a separate search engine? What each one cost and found"
description: "'Find Rahul, the one from Vesu, who called last week' is the search a CRM has to answer, and a regex on name does not. I built the client search three times: MongoDB's text index, then Atlas Search, then Meilisearch on the VPS. Where each one fell short, what the current one does, and the ranking tweaks that made people stop complaining."
date: 2028-05-01T03:30:00Z
tags: [search, mongodb, meilisearch, crm, nodejs]
keywords: [mongodb text search vs atlas search, meilisearch node.js, crm search implementation, typo tolerant search mongodb, search indexing sync mongodb]
project: growth-avenues-crm
image: /blog/stock/search-1.webp
imageAlt: "Magnifying glass over a postage stamp"
imageCredit: "Heptagon"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Magnifying_glass2.jpg"
imageLicense: "Public domain"
summary: "MongoDB's text index is free but has no typo tolerance or prefix matching; Atlas Search adds both if you are on Atlas; for self-hosted MongoDB a small engine such as Meilisearch next to the database gives typo-tolerant, ranked search kept in sync by hooks plus a nightly re-index."
faq:
  - q: "Why does MongoDB text search not find partial words?"
    a: "It matches whole stemmed words, so Rah does not match Rahul and phone fragments tokenise unpredictably. A dedicated engine supports prefix and typo matching."
  - q: "How do I keep Meilisearch in sync with MongoDB?"
    a: "Push changed documents from Mongoose save and update hooks through a queue, delete on delete, and re-index everything nightly to catch anything missed."
  - q: "Which search option should a small team pick?"
    a: "Text index if exact-ish matches are fine, Atlas Search if already on Atlas, Meilisearch or Typesense on the VPS if people expect typo-tolerant results."
---

The first search box in the CRM did `{ name: { $regex: q, $options: "i" } }`. It scanned the whole collection, found nothing for "Raul" when the record said "Rahul", and could not look at phone numbers, cities and notes at the same time. Every version since has been about closing those three gaps.

## Version 1: MongoDB text index

```js
clientSchema.index({ name: "text", email: "text", phone: "text", city: "text", "notes.text": "text" }, { weights: { name: 10, phone: 8, email: 5, city: 2 }, name: "client_text" });
await Client.find({ $text: { $search: q }, distributor }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }).limit(20);
```

Free, built in, uses an index. It was a real improvement: one query across five fields, weighted. Its limits showed up within a month:

- **No typo tolerance.** "Raul" finds nothing.
- **No prefix matching.** "Rah" finds nothing; text search matches whole stemmed words.
- **One text index per collection**, and it cannot be combined with other indexes in a compound way, so the `distributor` filter runs after the text match.
- **Phone numbers** tokenise unpredictably; "98765" did not find "9876543210".

For a small team, that is survivable. For a sales floor doing fifty searches an hour, it was the top complaint.

## Version 2: Atlas Search

If the database is on MongoDB Atlas, Atlas Search adds a Lucene index alongside the collection with fuzzy matching, autocomplete and faceting, queried through an aggregation stage:

```js
Client.aggregate([
  { $search: { index: "clients", compound: {
    must: [{ text: { query: q, path: ["name", "email", "city"], fuzzy: { maxEdits: 1 } } }],
    filter: [{ equals: { path: "distributor", value: distributorId } }],
  } } },
  { $limit: 20 },
]);
```

Typo tolerance, autocomplete via an `autocomplete` field type, synonyms, and the index stays in sync automatically because it is part of Atlas. For the CRM clients on Atlas, this was the answer and it is still running there.

The catch is that it only exists on Atlas. The HRMS and the Growth Avenues platform run MongoDB on their own VPS, where there is no Atlas Search.

## Version 3: Meilisearch next to the database

For self-hosted deployments, a small dedicated search engine on the same VPS. Meilisearch runs in a single binary, uses about 100 MB for the CRM's data, and gives typo tolerance, prefix search, and ranking rules out of the box:

```js
import { MeiliSearch } from "meilisearch";
const meili = new MeiliSearch({ host: "http://127.0.0.1:7700", apiKey: process.env.MEILI_KEY });
const index = meili.index("clients");
await index.updateSettings({
  searchableAttributes: ["name", "phone", "email", "city", "notesText"],
  filterableAttributes: ["distributor", "status"],
  rankingRules: ["words", "typo", "proximity", "attribute", "sort", "exactness", "lastContactAt:desc"],
  typoTolerance: { minWordSizeForTypos: { oneTypo: 4, twoTypos: 8 } },
});
const { hits } = await index.search(q, { filter: `distributor = "${distributorId}"`, limit: 20 });
```

"Raul" finds Rahul. "Rah" finds Rahul. "98765" finds the phone. And the extra ranking rule puts recently contacted clients first among equals, which turned out to be what "the one who called last week" meant.

## Keeping it in sync

The index is a copy, so writes must reach it. A Mongoose `post("save")` hook and a `post("findOneAndUpdate")` hook push the changed document; deletes remove it; a nightly job re-indexes everything to catch anything missed:

```js
clientSchema.post("save", function () { enqueue("index-client", { id: this._id }); });
// worker:
async function indexClient(id) {
  const c = await Client.findById(id).lean();
  if (!c || c.deletedAt) return index.deleteDocument(String(id));
  await index.addDocuments([{ id: String(c._id), name: c.name, phone: c.phone, email: c.email, city: c.city, distributor: String(c.distributor), status: c.status, notesText: c.notes.map((n) => n.text).join(" "), lastContactAt: c.lastContactAt?.getTime() ?? 0 }]);
}
```

Through a queue, not inline, so a search engine hiccup never fails a save. The nightly full re-index is the thing that makes the whole arrangement trustworthy.

## Which one

| Situation | Choice |
|---|---|
| Small team, exact-ish matches fine, no budget | MongoDB text index |
| On Atlas | Atlas Search |
| Self-hosted, people expect "Google-like" | Meilisearch or Typesense next to the DB |
| Millions of documents, analytics on search | OpenSearch, and a bigger server |

## The ranking tweaks that mattered

1. Recently contacted first among equal matches.
2. Exact phone match goes straight to the record, no results page.
3. Searching while typing, debounced at 150 ms, with the last query cancelled.
4. A "did you mean" line when there are zero results and a one-typo variant has some.

None of these are search-engine features; they are product decisions that the engine made possible.

## Sources

- MongoDB text indexes: [mongodb.com/docs/manual/core/indexes/index-types/index-text](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-text/)
- Atlas Search: [mongodb.com/docs/atlas/atlas-search](https://www.mongodb.com/docs/atlas/atlas-search/)
- Meilisearch: [meilisearch.com/docs](https://www.meilisearch.com/docs)
- Meilisearch ranking rules: [meilisearch.com/docs/learn/relevancy/ranking_rules](https://www.meilisearch.com/docs/learn/relevancy/ranking_rules)
- Typesense, a comparable alternative: [typesense.org/docs](https://typesense.org/docs/)
