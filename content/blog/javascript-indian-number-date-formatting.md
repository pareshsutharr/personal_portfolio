---
title: "Indian number and date formatting in JavaScript: lakhs, crores, and IST"
description: "₹12,34,567 not ₹1,234,567. 19 Oct 2026 not 10/19/2026. 9:30 am IST on every machine, including a server in Virginia. The Intl calls that get Indian formatting right, and the three places developers get it wrong."
date: 2027-06-07T03:30:00Z
tags: [javascript, react, i18n, dates]
keywords: [javascript indian number format lakh crore, intl numberformat en-IN, format rupees javascript, javascript date ist timezone, en-IN date format]
image: /blog/stock/checklist-1.webp
imageAlt: "Clipboards with paper checklists"
imageCredit: "Unknown"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:USMC-100914-M-0646Q-45.jpg"
imageLicense: "Public domain"
summary: "Intl with the en-IN locale gives lakh and crore grouping and rupee symbols without a library, and pinning timeZone to Asia/Kolkata in every date formatter makes a server in Virginia and a phone in Surat print the same string. Build formatters once at module level."
faq:
  - q: "How do I format numbers in lakhs and crores in JavaScript?"
    a: "new Intl.NumberFormat(\"en-IN\").format(1234567) returns 12,34,567. Add style currency and currency INR for the rupee symbol."
  - q: "Why does the same date show differently on server and client?"
    a: "Each formats in its own time zone. Pass timeZone: \"Asia/Kolkata\" to Intl.DateTimeFormat on both sides."
  - q: "What are the three common mistakes?"
    a: "Using toLocaleString without a locale, formatting dates without a time zone, and storing date-only values as midnight local time."
---

Every finance screen I have built for an Indian company has had the same two bugs at some point: numbers grouped in thousands instead of lakhs, and dates that shifted by a day on the server. Both are solved by `Intl`, the built-in internationalisation API, as long as you pass it two things explicitly: the locale `en-IN` and the time zone `Asia/Kolkata`.

## Numbers

```js
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
inr.format(1234567);    // "₹12,34,567"
inr.format(98500000);   // "₹9,85,00,000"

const plain = new Intl.NumberFormat("en-IN");
plain.format(1234567);  // "12,34,567"
```

The `en-IN` locale knows the 3-2-2 grouping. Without it, `toLocaleString()` uses whatever the machine's locale is, which on a US-configured server is `1,234,567`. Always pass the locale.

For compact figures on dashboards, lakhs and crores by hand are clearer than `notation: "compact"`, which produces "12L" in some engines and "1.2M" in others:

```js
export function compactInr(n) {
  if (n >= 1e7) return `₹${(n / 1e7).toFixed(2).replace(/\.?0+$/, "")} Cr`;
  if (n >= 1e5) return `₹${(n / 1e5).toFixed(2).replace(/\.?0+$/, "")} L`;
  return inr.format(n);
}
compactInr(45000000); // "₹4.5 Cr"
```

## Dates

A date stored as `2026-10-19T03:30:00Z` is 9:00 am in India. Format it in India time everywhere, or the same timestamp reads as 18 October on a server running in UTC-7:

```js
const TZ = "Asia/Kolkata";
const date = new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: TZ });
const time = new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: TZ });

date.format(new Date("2026-10-19T03:30:00Z")); // "19 Oct 2026"
time.format(new Date("2026-10-19T03:30:00Z")); // "09:00 am"
```

Create the formatter once at module level. Constructing `Intl.DateTimeFormat` is expensive; formatting with an existing one is cheap.

## The three mistakes

**1. Relying on the default time zone.** Works on your laptop, breaks on Vercel (UTC) and on any visitor's browser outside India. Pin `timeZone` in every formatter. On this site, forgetting it caused a React hydration error for readers in other zones.

**2. Building dates from parts.** `new Date(2026, 9, 19)` is local midnight on whatever machine runs it. For a calendar date, keep the string `2026-10-19` and format it as a date, or use `Date.UTC` and format in `Asia/Kolkata`.

**3. Parsing user input with `new Date(string)`.** "19/10/2026" parses as 19th month in some engines and `Invalid Date` in others. Use a date input, which gives you `YYYY-MM-DD`, or parse explicitly.

## In React

A tiny hook keeps formatters shared and gives components a clean call:

```tsx
const fmt = {
  inr: new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }),
  date: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }),
};
export const useFormat = () => fmt;

// <td>{inr.format(row.amount)}</td>
```

Because the formatters are the same objects on the server and in the browser, server-rendered HTML matches what React renders on the client, and there is no hydration mismatch.

## Amounts in words

Cheques, salary slips and invoices need "Rupees twelve lakh thirty-four thousand five hundred sixty-seven only". The PDF post has a 20-line function for it; packages that only know millions and billions will not do.

## Sources

- `Intl.NumberFormat`: [developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- `Intl.DateTimeFormat` and `timeZone`: [developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat)
- Indian numbering system: [en.wikipedia.org/wiki/Indian_numbering_system](https://en.wikipedia.org/wiki/Indian_numbering_system)
- IANA time zone database: [iana.org/time-zones](https://www.iana.org/time-zones)
