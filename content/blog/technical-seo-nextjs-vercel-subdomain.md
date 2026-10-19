---
title: "Technical SEO for a Next.js site on a Vercel subdomain: what actually moved the needle"
description: "I fixed the SEO of this portfolio in one afternoon. Most of the checklist items did nothing measurable. These five did: one bug, two files, and two pieces of content."
date: 2026-12-14T03:30:00Z
tags: [seo, nextjs, vercel]
keywords: [next.js seo, vercel subdomain seo, next.js metadata api, next.js sitemap, structured data next.js]
image: /blog/stock/writing-1.webp
imageAlt: "Person writing in a notebook beside a laptop"
imageCredit: "Shixart1985"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Person_writing_in_notebook_while_using_laptop_at_a_modern_workspace.jpg"
imageLicense: "CC BY 2.0"
summary: "Of a long technical SEO checklist, five things moved this site: fixing a canonical URL bug that pointed at localhost, adding a sitemap and robots file, and writing two pages of real content for the queries that matter. Everything else measured nothing."
faq:
  - q: "What technical SEO actually matters for a small Next.js site?"
    a: "Correct canonical URLs, a sitemap, a robots file, titles and descriptions per page, fast pages, and content that answers real queries."
  - q: "What was the canonical bug?"
    a: "The site URL fell back to localhost on Vercel because of a misconfigured environment variable, so every page told Google its canonical was localhost."
  - q: "Does a Vercel subdomain hurt ranking?"
    a: "It shares reputation with every other site on the subdomain and cannot build its own. A custom domain is the biggest lever left."
---

This site lives on a Vercel subdomain, which is the worst possible starting point for ranking on anything except my own name. I spent an afternoon on technical SEO and then watched Search Console for weeks. Here is what moved impressions and what did not.

## What did nothing

- The `keywords` meta tag. Google has ignored it since 2009. I set it anyway because it costs nothing, but it is not an SEO task.
- Changing `changeFrequency` and `priority` in the sitemap. Google says it mostly ignores both.
- Adding every schema.org type I could think of. More structured data does not mean more ranking; the right type for the page does.

## 1. The bug: every canonical URL pointed at localhost

I had `NEXT_PUBLIC_SITE_URL=http://localhost:3000` in my environment, and the production build on Vercel used it. Every page's canonical tag, Open Graph image and sitemap entry said `localhost`. Google indexes what the canonical says, which here was nothing.

The fix is a URL helper that refuses a localhost value when running on Vercel:

```ts
export function siteUrl() {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (explicit && !(vercel && /localhost/.test(explicit))) return explicit;
  if (vercel) return `https://${vercel}`;
  return explicit ?? "http://localhost:3000";
}
```

Use it for `metadataBase`, canonical links, the sitemap and robots. Check it with `curl -s https://yoursite/ | grep canonical` after every deploy; this one bug cost me weeks of indexing.

## 2. Titles that say what the page is for

"About" is not a title. "About, Full Stack Developer in Surat" is. Every page got a title under 60 characters including the site name, and a description under 160 that reads like a sentence a person would write.

```ts
export const metadata = pageMetadata({
  title: "Full Stack Development Services in Surat",
  description: "Full stack developer in Surat, India for web apps, mobile apps, admin systems, REST APIs and deployment. React, Node.js, MongoDB and Postgres, real examples.",
  path: "/services",
});
```

Impressions for "full stack developer surat" started within ten days of this change. Nothing else I did had an effect that fast.

## 3. Search Console, verified and with a sitemap submitted

Until you verify, Google has no reason to crawl a new subdomain quickly. Verification is a file in `public/` or a meta tag from the Metadata API:

```ts
export const metadata = { verification: { google: "your-token" } };
```

Then submit `/sitemap.xml` and request indexing for the two or three pages that matter. The first crawl came within a day of submitting.

## 4. The right structured data, not all of it

- `Person` on every page, with `address`, `worksFor`, `knowsAbout` and `sameAs` links to GitHub, LinkedIn and YouTube. This is what feeds the knowledge panel for your name.
- `ProfilePage` wrapping the person on the About page.
- `Service` items on the Services page, and `FAQPage` for the questions section.
- `BlogPosting` on each post, with `datePublished` and `author`.

Test every page with the Rich Results Test. One missing comma silently disables the whole block.

## 5. Content that answers a question

The single biggest source of new queries was a six-question FAQ on the Services page: "Do you work with clients outside Surat?", "Can you take over an existing project?", and so on. Real questions people type, answered in two sentences each. Google matched them to long-tail searches I never targeted.

## The thing that beats all five

A custom domain. Vercel's `.vercel.app` is shared with hundreds of thousands of projects, and search engines treat subdomains of it accordingly. Everything above helps; moving to `yourname.dev` helps more. That is the next change on this site, and I will write up the before and after.

## Sources

- Next.js Metadata API: [nextjs.org/docs/app/api-reference/functions/generate-metadata](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- Google on the keywords meta tag: [developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag](https://developers.google.com/search/blog/2009/09/google-does-not-use-keywords-meta-tag)
- Sitemap guidance, including which fields Google uses: [developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- Rich Results Test: [search.google.com/test/rich-results](https://search.google.com/test/rich-results)
- Vercel system environment variables: [vercel.com/docs/environment-variables/system-environment-variables](https://vercel.com/docs/environment-variables/system-environment-variables)
