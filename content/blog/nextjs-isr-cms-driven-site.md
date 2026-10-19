---
title: "Next.js ISR for a CMS-driven site: revalidate, tags, and what to cache"
description: "This portfolio's content lives in a database and changes from an admin panel, but the pages are static and fast. The mix of revalidate times and on-demand revalidation that makes that work, and the one thing I got wrong for a month."
date: 2027-03-15T03:30:00Z
tags: [nextjs, caching, performance, supabase]
keywords: [next.js isr revalidate, next.js revalidatePath revalidateTag, incremental static regeneration cms, next.js app router caching, static site with admin panel]
image: /blog/stock/code-2.webp
imageAlt: "Source code on a dark monitor"
imageCredit: "luis gomes"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Pexels-luis-gomes-546819.jpg"
imageLicense: "CC0"
summary: "Pages are static and fast while content lives in a database because each page has a revalidate time matched to how often it changes, and the admin's save actions call revalidatePath so edits show immediately. The month-long mistake was a layout-level revalidate that overrode the pages."
faq:
  - q: "How can a page be static if its content is in a database?"
    a: "Incremental static regeneration renders it once, serves the cached result, and re-renders in the background after the revalidate window or on demand."
  - q: "How do admin edits appear without waiting for the window?"
    a: "The server action that saves the record calls revalidatePath for the affected pages, dropping them from the cache."
  - q: "What was the mistake?"
    a: "A revalidate export on the shared layout that applied a shorter window to every page under it, hiding the per-page settings for a month."
---

Every page on this site is served as static HTML from a CDN, and every piece of text on it can be changed from an admin panel without a deploy. Those two facts are compatible because of incremental static regeneration: pages are built once, cached, and rebuilt in the background when they are stale or when the admin says so.

## The two knobs

**Time-based**: a page declares how long it may be served before Next.js regenerates it on the next request.

```ts
export const revalidate = 60;  // seconds
```

**On-demand**: a server action tells Next.js that specific paths are stale right now.

```ts
"use server";
import { revalidatePath } from "next/cache";

export async function updateProject(id: string, input: unknown) {
  // ...write to the database...
  revalidatePath("/projects");
  revalidatePath(`/projects/${slug}`);
  revalidatePath("/");             // the home page lists featured projects
}
```

Use both. Time-based is the safety net for anything you forgot to revalidate on demand. On-demand is what makes the admin feel instant.

## What I set, and why

| Page | revalidate | Reason |
| --- | --- | --- |
| Home, Projects, About | 60 s | Changes from admin; a minute of staleness is fine |
| Project detail | 60 s | Same, plus on-demand from the project editor |
| Blog list and posts | 3600 s | Content is files; a post dated for 09:00 appears by 10:00 |
| Open Graph image | 3600 s | Reads the site title; rarely changes |
| Sitemap | default | Regenerated per deploy and on request |
| Admin pages | dynamic | Always fresh; never cached |

The admin is `force-dynamic` on every page. Caching the thing you edit from is how you end up "fixing" a typo three times.

## The month I got wrong

Project pages use `generateStaticParams`, so every published project is prebuilt. A project I set to draft in the admin kept its page for weeks. The page was cached, the revalidate timer regenerated it, and the regeneration still found the project because the detail query did not filter by status. Two fixes: filter in the query, and revalidate the detail path when status changes. The timer alone would never have caught a query bug.

```ts
export const getProjectBySlug = cache(async (slug: string) => {
  const { data } = await supabase.from("projects").select("*")
    .eq("slug", slug).eq("status", "published").is("deleted_at", null).maybeSingle();
  return data;
});
```

## Tags for things that appear everywhere

Social links show in the header, the footer and the contact page. Revalidating three paths every time is brittle; tag the fetch and revalidate the tag:

```ts
import { unstable_cacheTag as cacheTag } from "next/cache";

export async function getSocialLinks() {
  "use cache";
  cacheTag("social-links");
  // ...query...
}

// in the server action
revalidateTag("social-links");
```

Which caching API is current depends on your Next.js version; the shape of the idea does not. Tag the data, not the page.

## Previewing drafts

Editors want to see a draft before publishing. A `/preview/projects/[slug]` route, `force-dynamic`, behind the admin login, renders the same component with the draft row. No draft mode cookies, no cache interaction, and the public URL stays static.

## How to tell it is working

```bash
curl -sI https://pareshsuthar.vercel.app/projects | grep -iE "x-vercel-cache|age|cache-control"
```

`x-vercel-cache: HIT` with a small `age` is what you want on a public page. A `MISS` on every request means something in the page opts out of static rendering, usually a `cookies()` or `headers()` call somewhere in the tree, including inside a shared layout.

## Sources

- Next.js caching and revalidating: [nextjs.org/docs/app/guides/caching](https://nextjs.org/docs/app/guides/caching)
- `revalidatePath` and `revalidateTag`: [nextjs.org/docs/app/api-reference/functions/revalidatePath](https://nextjs.org/docs/app/api-reference/functions/revalidatePath)
- Route segment config, `revalidate` and `dynamic`: [nextjs.org/docs/app/api-reference/file-conventions/route-segment-config](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config)
- Vercel cache headers: [vercel.com/docs/edge-network/caching](https://vercel.com/docs/edge-network/caching)
