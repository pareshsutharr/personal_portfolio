---
title: "From a Vercel subdomain to a custom domain: DNS, redirects, Search Console, and not losing what you had"
description: "Moving a site from yourname.vercel.app to yourname.dev is a one-hour job if you do the steps in the right order. The order, the two redirects that matter, and the Search Console change-of-address so rankings carry over."
date: 2027-07-12T03:30:00Z
tags: [vercel, dns, seo, deployment]
keywords: [vercel custom domain seo, move site to new domain seo, vercel add domain dns, 301 redirect vercel.app to custom domain, search console change of address]
---

A `.vercel.app` address is fine to launch on and a handicap to rank on. The domain is shared with every other Vercel project, and search engines treat it accordingly. Moving to your own domain is the single biggest SEO change available to a portfolio, and it is a short job as long as the old URLs redirect cleanly.

## Before you start

- Buy the domain. For a developer, `.dev` or `.in` are good; both are cheap and `.dev` enforces HTTPS.
- Note what you have: Search Console is verified, the sitemap is submitted, and a handful of pages have impressions. Export the performance report; you will want the before numbers.

## 1. Add the domain in Vercel

Project settings, Domains, add `yourname.dev` and `www.yourname.dev`. Vercel shows the DNS records it wants: an `A` record for the apex and a `CNAME` for `www`. Choose which one is canonical; I use the apex, with `www` redirecting to it. Vercel sets that redirect up for you when you mark one as primary.

## 2. DNS at the registrar

```
A      @     76.76.21.21
CNAME  www   cname.vercel-dns.com
```

The exact values are in the Vercel dialog; use those, not these. DNS takes minutes to hours to spread. Vercel issues the TLS certificate automatically once it sees the records.

## 3. Redirect the old subdomain

This is the step people skip, and it is why rankings do not carry over. Every `yourname.vercel.app/path` must send a permanent redirect to `yourname.dev/path`. In `next.config.ts`:

```ts
async redirects() {
  return [{
    source: "/:path*",
    has: [{ type: "host", value: "yourname.vercel.app" }],
    destination: "https://yourname.dev/:path*",
    permanent: true,
  }];
},
```

A 308 permanent redirect tells Google the page moved for good and passes along what the old URL had earned. Keep the redirect indefinitely; links to the old address exist on LinkedIn, in emails and in search results for months.

## 4. Fix every place the old URL is hard-coded

- The site URL environment variable, in Vercel and locally.
- The canonical URL in your SEO settings.
- Structured data `url` fields, if any are literal.
- The sitemap's base URL, which should come from the environment variable already.
- Social profiles, GitHub README, YouTube description, email signature.

Then deploy and check:

```bash
curl -sI https://yourname.vercel.app/about | grep -iE "^(HTTP|location)"
curl -s https://yourname.dev/about | grep -oE 'rel="canonical" href="[^"]+"'
```

The first should show a 308 to the new domain; the second should show the new domain.

## 5. Search Console

Add `yourname.dev` as a new property, verify it, submit the new sitemap. Then, on the old property, use Change of Address to point it at the new one. Google says this helps move signals during the transition. Keep both properties for a year.

## What to expect

Impressions on the old property fall to zero over a few weeks as the redirects are crawled; the new property picks them up. Rankings for your own name move within days. Rankings for competitive terms generally improve over the following months, because the new domain is yours alone.

## Mistakes I have seen

- **Redirecting everything to the home page.** `/about` must go to `/about`. A blanket redirect to `/` throws away every page's history.
- **Leaving the Vercel domain as canonical.** Then both domains compete and the new one looks like a copy.
- **Changing URLs at the same time.** Move the domain first. Restructure URLs, if ever, months later, with their own redirects.

## Sources

- Vercel custom domains: [vercel.com/docs/domains/working-with-domains/add-a-domain](https://vercel.com/docs/domains/working-with-domains/add-a-domain)
- Next.js redirects with host conditions: [nextjs.org/docs/app/api-reference/config/next-config-js/redirects](https://nextjs.org/docs/app/api-reference/config/next-config-js/redirects)
- Google, site move with URL changes: [developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- Search Console Change of Address tool: [support.google.com/webmasters/answer/9370220](https://support.google.com/webmasters/answer/9370220)
