---
title: "Redis caching in a Node API: what to cache, for how long, and how to invalidate without lying"
description: "The CRM dashboard ran eleven aggregation queries per load. Redis brought it to one cache read. The pattern I use, the keys, the TTLs, the invalidation on write, and the two things I tried to cache that should never have been cached."
date: 2028-02-28T03:30:00Z
tags: [redis, nodejs, caching, performance, mongodb]
keywords: [redis cache node.js api, cache invalidation strategy, cache aside pattern node, redis ttl keys design, ioredis express caching]
project: growth-avenues-crm
image: /blog/stock/abstract-1.webp
imageAlt: "Star trails photographed from orbit"
imageCredit: "NASA/Don Pettit"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:International_Space_Station_star_trails_-_JSC2012E039800.jpg"
imageLicense: "Public domain"
summary: "Use a cache-aside helper with explicit keys, short TTLs chosen by how wrong stale data can be, deletion on write for things that must be fresh after an edit, and a short lock to stop stampedes. Never cache permission checks, and never let Redis be the only copy of anything."
faq:
  - q: "What should a Redis cache key contain?"
    a: "An app prefix, a version segment, the thing, its scope and every input that changes the result, so one org's dashboard is never served to another."
  - q: "Should I update the cache on write or delete it?"
    a: "Delete it. The next read recomputes from the real query, so two code paths never have to agree on the cached shape."
  - q: "What should never be cached?"
    a: "Permission checks, because a removed user keeps access until the TTL expires, and anything read back in the same request that wrote it."
---

The dashboard everyone opens first thing in the morning computed totals across clients, leads, tasks and revenue, and took 1.8 seconds. The numbers change a few times an hour. Computing them on every load was waste, and Redis fixed it in an afternoon. The afternoon was mostly spent deciding what *not* to cache.

## Cache-aside, one helper

```js
import Redis from "ioredis";
export const redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 2, enableOfflineQueue: false });

export async function cached(key, ttlSeconds, compute) {
  try {
    const hit = await redis.get(key);
    if (hit) return JSON.parse(hit);
  } catch (err) { log.warn({ err, key }, "redis read failed; computing"); }

  const value = await compute();
  redis.set(key, JSON.stringify(value), "EX", ttlSeconds).catch((err) => log.warn({ err, key }, "redis write failed"));
  return value;
}
```

Read, miss, compute, write, return. Redis being down is a warning, not an error: the API keeps working, slower. `enableOfflineQueue: false` makes sure a dead Redis fails fast instead of queueing commands forever.

## Keys that say what they are

```js
const key = `crm:v2:dashboard:${orgId}:${day}`;
```

Prefix for the app, a version segment so a shape change does not read stale data, the thing, its scope, and the inputs that change the result. Keys without the inputs are the classic bug: one org's dashboard served to another.

## TTLs by how wrong stale data can be

| Data | TTL | Reasoning |
|---|---|---|
| Dashboard totals | 5 min | Nobody acts on the exact count of leads in the last minute |
| Client profile | 10 min, and invalidated on write | Read on every page; must be fresh after edit |
| Scheme master data | 24 h | Changes monthly; refreshed by the import job |
| Session lookups | 15 min, invalidated on logout | Fast auth checks; must die on logout |
| Search results | 60 s | Typing fast hits the same query repeatedly |

A short TTL is the simplest invalidation. Only cache for longer when there is a reliable write path to invalidate from.

## Invalidate on write

Where freshness after an edit matters, the write path deletes the key:

```js
async function updateClient(id, patch, actor) {
  const client = await Client.findOneAndUpdate({ _id: id }, patch, { new: true });
  await redis.del(`crm:v2:client:${id}`);
  await redis.del(`crm:v2:dashboard:${client.org}:${today()}`);   // totals may have moved
  return client;
}
```

Delete, do not update: the next read recomputes with the real query. Updating the cache from the write path means two code paths must agree on the shape, and one day they will not.

When a write affects many keys, a version counter is simpler than tracking them all: `INCR crm:v2:org:${orgId}:version`, include the version in every key for that org, and old keys expire on their own.

## Stampede protection

When a popular key expires, fifty requests miss at once and fifty aggregations run. A short lock around the compute stops that:

```js
const lock = await redis.set(`${key}:lock`, "1", "EX", 10, "NX");
if (!lock) { await sleep(100); return cached(key, ttlSeconds, compute); }   // someone else is computing; retry read
```

For the dashboard this turned "Monday 9 am is slow" into nothing at all.

## Two things not to cache

**Permission checks.** "Can this user see this client" was cached for 5 minutes. A user was removed from an org and could still open its clients for up to 5 minutes. Permissions are read from the database every time, which is a 1 ms indexed lookup, and not worth the risk.

**Anything written then read in the same request.** Create a note, then render the notes list from cache: the new note is missing. The create path invalidates, but a race between the delete and a concurrent read's write-back can re-cache the old list. The fix was to read the list fresh in the mutation's response and only cache on pure reads.

## Memory and eviction

Redis on the same VPS has `maxmemory 256mb` and `maxmemory-policy allkeys-lru`. If the cache fills, the least recently used keys go. Nothing in it is the source of truth, so losing keys is harmless. That rule, that nothing in Redis is the only copy, is what makes it a cache and not a database with a time bomb.

## Sources

- ioredis: [github.com/redis/ioredis](https://github.com/redis/ioredis)
- Redis `SET` with `EX` and `NX`: [redis.io/docs/latest/commands/set](https://redis.io/docs/latest/commands/set/)
- Redis eviction policies: [redis.io/docs/latest/develop/reference/eviction](https://redis.io/docs/latest/develop/reference/eviction/)
- Cache-aside pattern: [learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside](https://learn.microsoft.com/en-us/azure/architecture/patterns/cache-aside)
- Cache stampede: [en.wikipedia.org/wiki/Cache_stampede](https://en.wikipedia.org/wiki/Cache_stampede)
