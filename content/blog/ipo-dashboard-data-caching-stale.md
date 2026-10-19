---
title: "Building an IPO dashboard: data sources, caching, and showing stale honestly"
description: "The India IPO Dashboard on BEIPOREADY lists open, upcoming, awaiting-listing and listed issues across Mainboard and SME. The hard parts were not the table. They were where the data comes from, how often to fetch it, and what to show when the source is down."
date: 2027-03-08T03:30:00Z
tags: [react, nodejs, caching, fintech, data]
keywords: [ipo dashboard react, cache third party api node, stale while revalidate api, show stale data ui, fintech dashboard data sources]
project: beipoready
image: /blog/stock/market-2.webp
imageAlt: "Investor display boards in an office lobby"
imageCredit: "Raysonho @ Open Grid Scheduler / Grid Engine"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:ScotiaPlaza.JPG"
imageLicense: "CC0"
summary: "An IPO dashboard lives or dies on data freshness, so the hard parts were sources, fetch frequency and honesty: cache each source with its own TTL, show the fetched-at time on every table, and display the last good data with a warning when a source fails instead of an empty page."
faq:
  - q: "Where does IPO data come from?"
    a: "Exchange pages and public filings, fetched on a schedule and normalised into one shape; subscription figures refresh more often than the calendar."
  - q: "What should the page show when a source is down?"
    a: "The last successful data with a visible fetched-at time and a notice, never a blank table or silently stale numbers."
  - q: "How often should the data refresh?"
    a: "Open-issue subscription numbers every few minutes during market hours, the calendar a few times a day, and listed-issue history once a day."
---

BEIPOREADY's dashboard answers one question for a small business owner: what is happening in the IPO market right now. Open issues, upcoming ones, those waiting to list, and recent listings, split by Mainboard and SME. The table is a table. Everything interesting is upstream of it.

## Where the data comes from

There is no single free, official, machine-readable feed of Indian IPO activity. The exchanges publish issue details and listing information on their sites; aggregators and data vendors package it. BEIPOREADY uses a licensed data provider for the structured feed and the exchange pages for cross-checking specific fields. Whatever your source, treat it as something that will be late, partial or down at the worst moment, and design for that.

## Fetch on a schedule, serve from a cache

The API never calls the provider while a user waits. A worker fetches every ten minutes during market hours, less often otherwise, and writes a snapshot:

```js
// worker.js, run by PM2 alongside the API
import cron from "node-cron";

cron.schedule("*/10 9-17 * * 1-5", refresh, { timezone: "Asia/Kolkata" });
cron.schedule("0 */2 * * *", refresh, { timezone: "Asia/Kolkata" });

async function refresh() {
  try {
    const issues = await fetchFromProvider();          // throws on failure
    await Snapshot.create({ issues, fetchedAt: new Date(), ok: true });
  } catch (err) {
    await Snapshot.create({ issues: null, fetchedAt: new Date(), ok: false, error: String(err).slice(0, 500) });
  }
}
```

The read side returns the latest successful snapshot and its age:

```js
router.get("/ipos", async (req, res) => {
  const snap = await Snapshot.findOne({ ok: true }).sort({ fetchedAt: -1 }).lean();
  if (!snap) return res.status(503).json({ error: "Data not available yet" });
  res.set("Cache-Control", "public, max-age=120, stale-while-revalidate=600");
  res.json({ issues: snap.issues, fetchedAt: snap.fetchedAt, ageMinutes: Math.round((Date.now() - snap.fetchedAt) / 60000) });
});
```

A provider outage therefore never produces an empty dashboard. It produces an older one, and the response says how old.

## Show stale, say stale

The UI prints the snapshot time and changes tone as it ages:

```tsx
function Freshness({ fetchedAt, ageMinutes }: { fetchedAt: string; ageMinutes: number }) {
  const label = ageMinutes < 20 ? "Live" : ageMinutes < 180 ? `Updated ${ageMinutes} min ago` : `Last updated ${formatDateTime(fetchedAt)}`;
  const tone = ageMinutes < 20 ? "text-success" : ageMinutes < 180 ? "text-fg-300" : "text-warning";
  return <p className={`label-mono ${tone}`}>{label}</p>;
}
```

People make decisions off these numbers. "Last updated yesterday at 16:40" is a fact they can use; a silently stale "Live" is a lie.

## Normalise once, at write time

Provider fields change names and formats. The worker maps them into one shape the frontend trusts, so a provider change is a one-file fix:

```js
const normalise = (raw) => ({
  id: raw.symbol ?? raw.id,
  name: raw.company_name ?? raw.name,
  board: /sme/i.test(raw.platform ?? "") ? "SME" : "Mainboard",
  openDate: toISODate(raw.open),
  closeDate: toISODate(raw.close),
  priceBand: raw.price_band ?? null,
  lotSize: Number(raw.lot_size) || null,
  status: deriveStatus(raw),               // open | upcoming | awaiting_listing | listed
});
```

`deriveStatus` compares dates with today in `Asia/Kolkata`, not the server's UTC day, or an issue opening "today" shows as upcoming until 5:30 am.

## What the table does

Four tabs by status, a Mainboard/SME toggle, and a search box. Sorting defaults to close date for open issues and listing date for listed ones. That is the whole interaction model; the data is dense enough without filters nobody asked for.

## Two rules I keep

1. **Never invent a number.** Missing GMP, missing subscription figures: show a dash. A guessed value in a finance table is worse than a blank.
2. **Log every fetch, including the failures.** When someone asks why Tuesday's data looked off, the snapshot history answers in a minute.

## Sources

- node-cron with time zones: [github.com/node-cron/node-cron](https://github.com/node-cron/node-cron)
- HTTP `stale-while-revalidate`: [developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#stale-while-revalidate)
- NSE IPO information: [nseindia.com/market-data/all-upcoming-issues-ipo](https://www.nseindia.com/market-data/all-upcoming-issues-ipo)
- BSE IPO information: [bseindia.com/markets/PublicIssues/IPODisplay.aspx](https://www.bseindia.com/markets/PublicIssues/IPODisplay.aspx)
