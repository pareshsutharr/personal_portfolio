---
title: "Sitemaps for CMS content: dynamic routes, lastmod, and posts that are not live yet"
description: "A sitemap that lists a draft, or misses a page that went live an hour ago, costs you indexing. How this site generates its sitemap from the database and the blog folder, what lastmod should be, and the two things Google actually reads from it."
date: 2027-09-06T03:30:00Z
tags: [seo, nextjs, sitemap]
keywords: [next.js dynamic sitemap, sitemap.ts app router, sitemap lastmod, exclude drafts from sitemap, sitemap scheduled posts]
---

Google uses a sitemap for two things: discovering URLs it has not seen, and deciding which known URLs to recrawl, based on `lastmod`. It mostly ignores `priority` and `changefreq`. So a good sitemap for a CMS-driven site is simple: every public URL, none of the private ones, with an honest last-modified date.

## The file

In the App Router, `app/sitemap.ts` returns an array and Next.js serves it at `/sitemap.xml`:

```ts
import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getProjectSlugs, getNowPage, getSiteSettings } from "@/lib/queries/public";
import { getPosts } from "@/lib/blog";

const STATIC = ["/", "/projects", "/services", "/about", "/experience", "/skills", "/certifications", "/contact", "/blog"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, posts, settings, now] = await Promise.all([getProjectSlugs(), getPosts(), getSiteSettings(), getNowPage()]);

  const entries: MetadataRoute.Sitemap = STATIC.map((path) => ({ url: absoluteUrl(path) }));

  if (settings?.show_now_page && now) entries.push({ url: absoluteUrl("/now"), lastModified: now.updated_at });

  for (const p of projects) entries.push({ url: absoluteUrl(`/projects/${p.slug}`), lastModified: p.updated_at });
  for (const p of posts) entries.push({ url: absoluteUrl(`/blog/${p.slug}`), lastModified: p.updated ?? p.date });

  return entries;
}
```

## Only what is public

`getProjectSlugs` applies the same filter the project page does: published, public, not deleted. `getPosts` returns only posts whose date has passed. The sitemap never knows about drafts or scheduled posts, because the functions it calls do not return them.

That shared filter is the important part. If the sitemap had its own query, it would drift from the page's query, and one day it would list a page that returns 404 or a draft that returns content. Both are errors in Search Console.

## lastmod that means something

`lastModified` should be when the content changed, not when the sitemap was generated. Projects carry `updated_at` from the database; posts carry an `updated` frontmatter field, falling back to the publish date. A sitemap where every URL has today's date tells Google nothing and, over time, gets its `lastmod` ignored.

## Posts that go live later

A scheduled post is a file with a future date. It is excluded until then. Because the sitemap is a route, it regenerates on request; with the default caching it refreshes on deploy and on revalidation. After the post's date passes, the next regeneration includes it, and Google sees a new URL with a fresh `lastmod`. No manual step.

To nudge Google sooner, the blog index page is in the sitemap too, and it links to the new post; crawling the index finds it even before the sitemap refreshes.

## Robots

```ts
// app/robots.ts
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/preview", "/api"] },
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
```

The `sitemap` line is how crawlers that are not Google find it. The disallow list keeps the admin and the draft preview out of the index; both are also behind a login, but robots rules stop the URLs appearing at all.

## Checking it

```bash
curl -s https://yoursite/sitemap.xml | grep -c "<loc>"            # how many URLs
curl -s https://yoursite/sitemap.xml | grep -oE "<loc>[^<]+" | sed 's/<loc>//' | xargs -I{} sh -c 'echo "$(curl -s -o /dev/null -w "%{http_code}" {}) {}"' | grep -v "^200"
```

The second command prints any sitemap URL that does not return 200. It should print nothing. Run it after any change to the filters, and once a month regardless.

## Sources

- Google, build and submit a sitemap, including which tags are used: [developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- Next.js `sitemap.ts`: [nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- Next.js `robots.ts`: [nextjs.org/docs/app/api-reference/file-conventions/metadata/robots](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- Sitemaps protocol: [sitemaps.org/protocol.html](https://www.sitemaps.org/protocol.html)
