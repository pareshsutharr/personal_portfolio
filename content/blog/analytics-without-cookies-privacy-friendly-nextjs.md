---
title: "Analytics without cookies: what this site measures, how, and why there is no consent banner"
description: "I wanted to know which posts people read and where they came from, without a banner, without a third-party script, and without identifying anyone. The approach: a tiny server-side endpoint, a daily salted hash instead of a user id, aggregated tables in Supabase, and a page in the admin. What it can tell me, what it cannot, and the alternatives if you do not want to build it."
date: 2028-06-12T03:30:00Z
tags: [analytics, privacy, nextjs, supabase, seo]
keywords: [privacy friendly analytics self hosted, analytics without cookies no consent banner, next.js server side analytics, plausible alternative diy, page view tracking supabase]
project: portfolio
---

The analytics snippet removed during the performance work was never replaced with another one. Instead the site counts its own page views, in a way that stores nothing about individuals, which is why there is no cookie banner. Here is what it does and does not do.

## What gets recorded

One row per page view, in a Supabase table, with these columns and no others:

| Column | Example | Note |
|---|---|---|
| `day` | `2028-06-12` | Date in Asia/Kolkata, not a timestamp |
| `path` | `/blog/zod-validation-express-nextjs` | Query string stripped |
| `referrer_host` | `google.com` | Host only, never the full URL |
| `country` | `IN` | From the request's geo header on Vercel |
| `device` | `mobile` | From the user agent, three buckets |
| `visitor` | `a3f9…` | A hash that changes every day, see below |

No IP address, no user agent string, no cookie, no local storage.

## The visitor hash

```ts
const salt = await getDailySalt();   // random 32 bytes, regenerated at midnight, old one discarded
const visitor = createHash("sha256").update(`${salt}:${ip}:${userAgent}`).digest("hex").slice(0, 16);
```

Within one day, the same device produces the same hash, so "unique visitors today" is countable. At midnight the salt is replaced and the old one deleted, so there is no way to link today's hash to tomorrow's or to recover the IP. This is the approach the privacy-focused analytics products document, and the reason they can run without consent under GDPR guidance from several regulators. It is a design choice that trades "returning visitors" for not holding personal data.

## The endpoint

```ts
// app/api/hit/route.ts
export async function POST(req: Request) {
  const { path, referrer } = await req.json();
  if (typeof path !== "string" || path.length > 200 || isBot(req.headers.get("user-agent"))) return new Response(null, { status: 204 });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "";
  const ua = req.headers.get("user-agent") ?? "";
  await db.from("hits").insert({
    day: todayInKolkata(), path: path.split("?")[0], referrer_host: hostOf(referrer), country: req.headers.get("x-vercel-ip-country") ?? null,
    device: deviceBucket(ua), visitor: await visitorHash(ip, ua),
  });
  return new Response(null, { status: 204 });
}
```

The client side is a few lines in the root layout that POSTs on navigation with `navigator.sendBeacon`, so it never delays the page. Bots are filtered by user agent; the ones that lie about it inflate counts slightly and that is accepted.

## Reading it

A SQL view aggregates per day and path, and the admin has a page with three tables: top pages this week, top referrers, and a daily total line. The question it answers most often is "did that LinkedIn post send anyone", and the answer is in `referrer_host`.

```sql
create view daily_pages as
select day, path, count(*) as views, count(distinct visitor) as visitors
from hits group by day, path;
```

Raw `hits` rows are deleted after 90 days by a scheduled function; the aggregated view's numbers are copied to a `daily_summary` table before that, so history survives without the per-view rows.

## What it cannot tell me

Returning visitors across days. Session duration. Funnels. Which button someone clicked. For a portfolio, none of these change a decision. For a client's product, where they do, the right tool is a product analytics platform with consent, and that is a different post.

## If you do not want to build it

Plausible, Fathom and Umami do this with a dashboard and bot filtering that is better than mine. Umami is open source and runs on the same VPS as everything else. The reason this site has its own is that it was a two-hour build, it lives in a database I already run, and I wanted to understand exactly what is stored before saying "no personal data".

## The consent question

The banner is required when a site stores or reads identifiers on the person's device for non-essential purposes, or processes personal data without another lawful basis. This design does neither: nothing is written to the device and the stored hash is not reversible to a person. Several EU regulators have published guidance accepting this kind of aggregate measurement without consent; it is still worth reading your own jurisdiction's. India's data protection law takes a similar line on anonymised data.

## Sources

- Plausible's data policy, a clear description of the daily-salt approach: [plausible.io/data-policy](https://plausible.io/data-policy)
- Umami, self-hosted: [umami.is/docs](https://umami.is/docs)
- CNIL guidance on audience measurement exemptions: [cnil.fr/en/cookies-and-other-tracking-devices-cnil-publishes-new-guidelines](https://www.cnil.fr/en/cookies-and-other-tracking-devices-cnil-publishes-new-guidelines)
- `navigator.sendBeacon`: [developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon)
- Vercel geolocation headers: [vercel.com/docs/edge-network/headers/request-headers#x-vercel-ip-country](https://vercel.com/docs/edge-network/headers/request-headers#x-vercel-ip-country)
