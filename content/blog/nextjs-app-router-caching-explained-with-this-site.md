---
title: "Next.js App Router caching, explained with this site: what is static, what revalidates, and what is always fresh"
description: "Every page on this site makes a caching decision, and the App Router has four places where that decision lives. The blog list revalidates hourly, the admin is never cached, a post page is static until its file changes, the feedback form is a server action that revalidates a path. Which setting does what, and the debugging routine for 'why is this stale'."
date: 2028-05-22T03:30:00Z
tags: [nextjs, caching, performance, react]
keywords: [next.js app router caching explained, revalidatePath vs revalidateTag, next.js force-dynamic, next.js ISR revalidate, next.js stale data debugging]
project: portfolio
---

The App Router's caching has a reputation for being confusing, and most of the confusion comes from four separate mechanisms being described as one. Looked at page by page on a real site, each one is simple. Here is every kind of page this site has and the caching it uses.

## The four layers

1. **Full route cache**: the rendered HTML and payload of a static route, stored at build time or on first request, served until revalidated.
2. **Data cache**: results of `fetch` on the server, persisted across requests and deployments, keyed by URL and options.
3. **Router cache**: the browser's in-memory copy of visited routes, for instant back and forward.
4. **Request memoisation**: the same `fetch` called twice during one render runs once. Not really a cache; a dedupe.

Each page below touches one or two of these.

## A blog post page: static, revalidated hourly

```ts
// app/(public)/blog/[slug]/page.tsx
export const revalidate = 3600;
export async function generateStaticParams() { return (await getPosts()).map((p) => ({ slug: p.slug })); }
```

Every published post is rendered at build time and served from the full route cache. After an hour, the next request triggers a background re-render; that request still gets the old page, the one after gets the new one. The posts are Markdown files, so "fresh" means "within an hour of a deploy", which is the behaviour that lets a scheduled post appear on Monday morning without anyone deploying on Monday morning.

## The blog index and the sitemap: the same

Also `revalidate = 3600`. A post whose date passes becomes visible on both within the hour.

## The home page: static, revalidated on write

The home page reads projects and settings from Supabase. The query uses the Supabase client, not `fetch` directly, so the data cache does not apply; the page itself is in the full route cache because nothing in it reads request-time data. When a project changes in the admin, the server action calls:

```ts
revalidatePath("/");
revalidatePath("/work");
revalidatePath(`/work/${slug}`);
```

Which drops those routes from the full route cache so the next request re-renders. Hours of staleness would be fine for a portfolio, but an admin who just hit Save expects to see it, so write-triggered invalidation is the right tool.

## The admin: never cached

```ts
// app/admin/(protected)/layout.tsx
export const dynamic = "force-dynamic";
```

The admin reads the session cookie, so it is dynamic anyway; `force-dynamic` makes that explicit so that a future refactor cannot accidentally make the inbox static. Every request renders. This is correct for a page one person opens.

## The cover image route: cached, revalidated hourly

```ts
// app/(public)/blog/[slug]/cover/route.tsx
export const revalidate = 3600;
```

Route handlers with `GET` and no request-specific reads are cached like pages. The image is generated once per hour at most per post, and otherwise served from cache. Without this the handler would render a 1200×630 image on every social crawler hit.

## Fetch with tags: for external data

Where a page does call `fetch`, tags give finer control than paths:

```ts
const res = await fetch(`${API}/videos`, { next: { tags: ["videos"], revalidate: 86400 } });
// later, in the action that syncs videos:
revalidateTag("videos");
```

Every page that used that fetch, however many, is invalidated by one call. Path-based invalidation needs you to know every page; tag-based needs you to know the data.

## The router cache and the "it still shows old data" report

After an admin saves and is redirected back to the list, the list sometimes showed the old row. That was the browser's router cache serving the previous payload. `revalidatePath` in the action also purges the router cache for the current session on the next navigation, but a `router.push` in the same tick can beat it. The fix: `redirect()` from the server action instead of a client-side push, which carries the fresh payload.

## Debugging staleness, in order

1. Is the route static when it should be dynamic? Check the build output's symbols, or add `dynamic = "force-dynamic"` temporarily to see if the problem disappears.
2. Is `fetch` caching the data? Add `cache: "no-store"` to the one call and re-test.
3. Did the write path call `revalidatePath` or `revalidateTag` for *this* route or tag? Grep for it.
4. Is it the browser's router cache? Hard-reload. If that fixes it, it was.
5. Is it Nginx or a CDN in front? Check `X-Cache` and `Cache-Control` as in the Nginx post.

Nine times out of ten it is step 3.

## Sources

- Next.js caching overview: [nextjs.org/docs/app/guides/caching](https://nextjs.org/docs/app/guides/caching)
- Route segment config (`revalidate`, `dynamic`): [nextjs.org/docs/app/api-reference/file-conventions/route-segment-config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- `revalidatePath`: [nextjs.org/docs/app/api-reference/functions/revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- `revalidateTag`: [nextjs.org/docs/app/api-reference/functions/revalidateTag](https://nextjs.org/docs/app/api-reference/functions/revalidateTag)
- Incremental static regeneration: [nextjs.org/docs/app/guides/incremental-static-regeneration](https://nextjs.org/docs/app/guides/incremental-static-regeneration)
