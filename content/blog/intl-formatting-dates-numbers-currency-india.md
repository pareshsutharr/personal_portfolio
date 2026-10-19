---
title: "Formatting dates, numbers and rupees with Intl: no libraries, no hydration mismatches"
description: "₹1,23,456, 3 Feb 2028, 'in 2 hours', 9:30 am IST. Every one of these comes from the Intl API built into JavaScript, with no date library in the bundle. The formatters this site and my client apps share, the time zone rule that stops React hydration errors, and the one place Intl is not enough."
date: 2028-02-21T03:30:00Z
tags: [javascript, intl, i18n, react, frontend]
keywords: [intl numberformat indian rupees, intl datetimeformat timezone, react hydration mismatch date, format currency javascript india, relativetimeformat javascript]
project: portfolio
image: /blog/stock/writing-2.webp
imageAlt: "Notebook and pen on a desk next to a laptop"
imageCredit: "Shixart1985"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Person_writing_in_a_notebook_while_sitting_at_a_desk.jpg"
imageLicense: "CC BY 2.0"
---

This site has no date library. Neither does the CRM. `Intl` does everything they need, is in every browser and Node version in use, and adds nothing to the bundle. The only trick is to create the formatters once, pin the time zone, and use them everywhere.

## One module of formatters

```ts
// lib/format.ts
const TZ = "Asia/Kolkata";
const LOCALE = "en-IN";

const dateFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric", timeZone: TZ });
const dateTimeFmt = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: TZ });
const timeFmt = new Intl.DateTimeFormat(LOCALE, { hour: "numeric", minute: "2-digit", timeZone: TZ });
const monthFmt = new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: TZ });
const inrFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inrExactFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const numFmt = new Intl.NumberFormat(LOCALE);
const compactFmt = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const relFmt = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

export const fmt = {
  date: (d: Date | string) => dateFmt.format(new Date(d)),          // 3 Feb 2028
  dateTime: (d: Date | string) => dateTimeFmt.format(new Date(d)),  // 3 Feb 2028, 9:30 am
  time: (d: Date | string) => timeFmt.format(new Date(d)),          // 9:30 am
  month: (d: Date | string) => monthFmt.format(new Date(d)),        // February 2028
  inr: (n: number) => inrFmt.format(n),                             // ₹1,23,456
  inrExact: (n: number) => inrExactFmt.format(n),                   // ₹1,23,456.50
  num: (n: number) => numFmt.format(n),                             // 12,34,567
  compact: (n: number) => compactFmt.format(n),                     // 1.2 Cr? no: 12L. See below.
  relative,
};
```

Formatters are not free to construct; building them at module level and reusing them is the difference between fine and slow in a table of 500 rows.

## `en-IN` gives the lakh grouping

`new Intl.NumberFormat("en-IN").format(1234567)` is `12,34,567`. With `style: "currency", currency: "INR"` it is `₹12,34,567.00`. No custom code. This is the single most common question I get about Indian number formatting and the answer is one locale string.

Compact notation in `en-IN` gives `12L` and `1.2Cr` for lakhs and crores in current engines, which is what dashboards want. Check the output in your Node version once; older ICU data gave `1.2M`.

## Pin the time zone or React will complain

A server in UTC renders "3 Feb 2028, 3:30 am" and the browser in India renders "3 Feb 2028, 9:00 am" for the same instant. React sees different text on each side and throws a hydration mismatch. This site had exactly that error on the blog's date line.

The fix is in the module above: every date formatter has `timeZone: "Asia/Kolkata"`. Both server and browser produce the same string. For an app whose users are in several zones, the zone becomes a per-user setting passed into the formatter, still pinned, still identical on both sides.

Dates that are only dates, like a leave request's start day, are stored as `YYYY-MM-DD` strings and formatted by parsing as UTC midnight then formatting with the pinned zone, so they never shift by a day.

## Relative time without a library

```ts
function relative(d: Date | string, now = new Date()) {
  const diff = (new Date(d).getTime() - now.getTime()) / 1000;
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["year", 31536000], ["month", 2592000], ["week", 604800], ["day", 86400], ["hour", 3600], ["minute", 60]];
  for (const [unit, secs] of units) if (Math.abs(diff) >= secs) return relFmt.format(Math.round(diff / secs), unit);
  return "just now";
}
// relative(twoHoursAgo) → "2 hours ago"; relative(tomorrow) → "tomorrow"
```

`numeric: "auto"` is what turns `-1 day` into "yesterday". Relative times are client-only in React, rendered after mount, because "2 hours ago" at render time and "2 hours ago" at hydration time can differ by a minute and mismatch.

## Durations

"7h 30m" for worked time has no `Intl` formatter in wide use yet. It is a two-line function. `Intl.DurationFormat` exists in newer engines and will replace it; not yet across every browser the HRMS supports.

## Where Intl is not enough

Date arithmetic. Adding months, finding the start of a week, comparing days across zones: `Intl` formats, it does not compute. For the few places that need it, the HRMS has a 60-line `dates.ts` of plain functions over `Date.UTC`. `Temporal` will make those go away; it is landing in browsers now and is the thing to learn next.

## Sources

- `Intl.NumberFormat`: [developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- `Intl.DateTimeFormat`: [developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- `Intl.RelativeTimeFormat`: [developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat)
- React hydration mismatch causes: [react.dev/reference/react-dom/client/hydrateRoot#hydrating-server-rendered-html](https://react.dev/reference/react-dom/client/hydrateRoot#hydrating-server-rendered-html)
- Temporal proposal: [tc39.es/proposal-temporal/docs](https://tc39.es/proposal-temporal/docs/)
