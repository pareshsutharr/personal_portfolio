---
title: "Cursor pagination in MongoDB and React: infinite lists that stay fast"
description: "Page 1 of the audit log loaded in 20 ms and page 200 in two seconds. Offset pagination was the reason. The cursor-based version, from the Mongo query to the React hook with a sentinel, and the two edge cases that break naive cursors."
date: 2027-06-14T03:30:00Z
tags: [mongodb, react, performance, api]
keywords: [cursor pagination mongodb, keyset pagination node, react infinite scroll intersection observer, mongodb pagination without skip, load more api design]
project: growth-avenues-admin
---

The audit log in the Growth Avenues back office grows by a few thousand rows a day. Paginating it with `skip` and `limit` worked for a month, then page 200 took two seconds because MongoDB walked 10,000 index entries to throw them away. Cursor pagination makes every page cost the same. This is the whole thing: the query, the API shape, and the React side.

## The idea

Instead of "give me page 200", the client says "give me 50 rows after this one", passing the sort key of the last row it has. The database seeks straight to that point in the index.

## The query

Sort by something unique and monotonic. `_id` works when you want insertion order; for "newest first" plus a tiebreaker, sort on `(createdAt, _id)`:

```js
async function listAudit({ limit = 50, after } = {}) {
  const filter = {};
  if (after) {
    const [ts, id] = after.split("_");
    filter.$or = [
      { createdAt: { $lt: new Date(Number(ts)) } },
      { createdAt: new Date(Number(ts)), _id: { $lt: new ObjectId(id) } },
    ];
  }
  const rows = await Audit.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit + 1).lean();
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  const last = page.at(-1);
  return { rows: page, nextCursor: hasMore && last ? `${last.createdAt.getTime()}_${last._id}` : null };
}
```

Fetching `limit + 1` is the trick that tells you whether another page exists without a second query. The index that serves this is `{ createdAt: -1, _id: -1 }`.

The `$or` handles the tie: two rows with the same millisecond timestamp are ordered by `_id`, and the cursor encodes both, so no row is skipped or repeated at a page boundary. A cursor on `createdAt` alone has that bug, and it shows up exactly when a batch import writes many rows in the same millisecond.

## The API

```
GET /api/audit?limit=50
GET /api/audit?limit=50&after=1770000000000_64a1f...
→ { "rows": [...], "nextCursor": "1769999000000_64a1e..." | null }
```

The cursor is opaque to the client. It can change format later without touching the frontend. Filters, like `?user=...`, are added to `filter` before the cursor condition and must be part of the index if you want them fast: `{ user: 1, createdAt: -1, _id: -1 }`.

## The React hook

```tsx
export function useCursorList<T>(url: string) {
  const [rows, setRows] = useState<T[]>([]);
  const [cursor, setCursor] = useState<string | null | undefined>(undefined); // undefined = not started
  const [loading, setLoading] = useState(false);

  const loadMore = useCallback(async () => {
    if (loading || cursor === null) return;
    setLoading(true);
    const res = await fetch(`${url}${cursor ? `&after=${cursor}` : ""}`);
    const data = await res.json();
    setRows((r) => [...r, ...data.rows]);
    setCursor(data.nextCursor);
    setLoading(false);
  }, [url, cursor, loading]);

  useEffect(() => { void loadMore(); }, []); // first page
  return { rows, loadMore, done: cursor === null, loading };
}
```

And a sentinel element that loads the next page when it scrolls into view:

```tsx
function Sentinel({ onVisible }: { onVisible: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && onVisible(), { rootMargin: "400px" });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [onVisible]);
  return <div ref={ref} className="h-px" />;
}
```

`rootMargin: "400px"` starts loading before the user reaches the end, so the list never visibly waits.

## Two edge cases

**New rows while scrolling.** With newest-first ordering, rows inserted after the first page do not appear until refresh. That is correct for a log. For a feed that should show them, add a "new entries" banner that refetches the first page and prepends the difference.

**Deleted rows.** A cursor pointing at a deleted row still works, because the condition is "less than this key", not "this row". Offset pagination would have shifted every subsequent page by one.

## When to keep offset

Page numbers in the URL, jumping to page 37, a total count in the footer: offset pagination gives you those and cursors do not. For admin tables under ten thousand rows, offset is simpler and fine. For logs, feeds and anything that grows without bound, cursors.

## Sources

- MongoDB on `skip` performance: [mongodb.com/docs/manual/reference/method/cursor.skip/#using-range-queries](https://www.mongodb.com/docs/manual/reference/method/cursor.skip/#using-range-queries)
- Compound index prefixes: [mongodb.com/docs/manual/core/indexes/index-types/index-compound/#index-prefixes](https://www.mongodb.com/docs/manual/core/indexes/index-types/index-compound/#index-prefixes)
- `IntersectionObserver`: [developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
