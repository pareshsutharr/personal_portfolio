---
title: "A Markdown blog in Next.js with scheduled publishing and no database"
description: "This blog is a folder of Markdown files. Posts publish on a set date with no cron, no CMS and no deploy. The whole implementation, from the frontmatter loader to the hourly revalidation that makes scheduling work, in about 150 lines."
date: 2027-09-13T03:30:00Z
tags: [nextjs, markdown, blog, react]
keywords: [next.js markdown blog scheduled posts, gray-matter marked next.js, file based blog app router, schedule blog post without cron, next.js blog static generation]
image: /blog/stock/alarm-3.webp
imageAlt: "Classic twin-bell alarm clock"
imageCredit: "Santeri Viinamäki"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Classic_alarm_clock_20180513.jpg"
imageLicense: "CC BY-SA 4.0"
---

You are reading a Markdown file. It sits in `content/blog/` in the site's repository, has a `date` in its frontmatter, and became public when that date passed. No database row, no publish button, no cron job. The mechanism is small enough to show in full.

## Why files

Posts are code-adjacent: they have code blocks, they get reviewed in diffs, and they are easier to write in an editor than in a CMS textarea. Git is the version history. The admin panel shows the list, but editing happens where the writing happens.

## The loader

```ts
import "server-only";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

const DIR = path.join(process.cwd(), "content", "blog");

export type Post = { slug: string; title: string; description: string; date: string; tags: string[]; html: string; readingMinutes: number };

async function readPost(file: string): Promise<Post | null> {
  const { data, content } = matter(await readFile(path.join(DIR, file), "utf8"));
  const date = data.date ? new Date(data.date).toISOString() : null;
  if (!data.title || !date) return null;
  const words = content.split(/\s+/).length;
  return {
    slug: file.replace(/\.md$/, ""),
    title: String(data.title),
    description: String(data.description ?? ""),
    date,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    html: marked.parse(content, { async: false }) as string,
    readingMinutes: Math.max(1, Math.round(words / 220)),
  };
}

export async function getPosts({ includeScheduled = false } = {}) {
  const files = (await readdir(DIR)).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
  const posts = (await Promise.all(files.map(readPost))).filter((p): p is Post => p !== null);
  posts.sort((a, b) => b.date.localeCompare(a.date));
  const now = new Date().toISOString();
  return includeScheduled ? posts : posts.filter((p) => p.date <= now);
}
```

`import "server-only"` guarantees this never ends up in a client bundle; it reads the filesystem. Files starting with `_` are ignored, which is where the topic calendar lives.

## The scheduling trick

The filter `p.date <= now` runs whenever the page renders. The pages that render posts declare:

```ts
export const revalidate = 3600;
```

So the list and each post are static, cached, and regenerated at most once an hour. A post dated Monday 09:00 is excluded on Sunday, and on the first request after 09:00 Monday the regenerated page includes it. The latest it can appear is 10:00. No job scheduler, no webhook; the publish date is the only input.

The detail page uses `generateStaticParams` over public posts at build time, and falls back to rendering on demand for a slug that was not built, which is exactly what a post crossing its date between deploys needs.

## Rendering

The post body is trusted content from the repository, so it is rendered straight to HTML:

```tsx
<div className="prose-blog" dangerouslySetInnerHTML={{ __html: post.html }} />
```

Styling comes from a `.prose-blog` block in the global stylesheet: headings, code blocks, lists, tables. About sixty lines of CSS and no typography plugin.

## What else the folder feeds

- The RSS feed at `/feed.xml`, a route handler that maps `getPosts()` to XML.
- The sitemap, which adds each public post with its date as `lastmod`.
- A "latest writing" section on the home page, three most recent.
- `BlogPosting` structured data per post, and a generated cover image per post from a route that draws the title on the site's black.
- The admin, which calls `getPosts({ includeScheduled: true })` and shows what is live and what is waiting.

## Writing a post

Copy the previous file. Change the frontmatter: title, description, date set to the next Monday at `03:30:00Z`, tags. Write. Commit, push. That is the entire publishing workflow, and it has not needed anything more.

## Sources

- gray-matter: [github.com/jonschlinkert/gray-matter](https://github.com/jonschlinkert/gray-matter)
- marked: [marked.js.org](https://marked.js.org/)
- Next.js `revalidate` segment config: [nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate](https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config#revalidate)
- `server-only` package: [nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning](https://nextjs.org/docs/app/getting-started/server-and-client-components#preventing-environment-poisoning)
