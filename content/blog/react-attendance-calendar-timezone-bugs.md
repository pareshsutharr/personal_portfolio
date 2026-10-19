---
title: "Building an HRMS attendance calendar in React, and the timezone bugs that came with it"
description: "The attendance calendar in Growth HR looks simple: a month grid with present, half-day, absent and holiday. The bugs were all about dates. Here is the data model, the grid, and the rules that stopped a punch at 11:50 pm from landing on the wrong day."
date: 2027-01-18T03:30:00Z
tags: [react, hrms, dates, mongodb, javascript]
keywords: [react attendance calendar, hrms attendance system, javascript date timezone bug, store dates mongodb timezone, react month calendar component]
project: growth-avenues-hrms
image: /blog/stock/alarm-1.webp
imageAlt: "Alarm clock on a dark desk"
imageCredit: "Raul Petri raulpetri"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Alarm_Clock_(Unsplash).jpg"
imageLicense: "CC0"
summary: "Store attendance days as YYYY-MM-DD strings, compute the day of a punch in the office time zone before saving, and build the month grid from those strings rather than Date objects. Every bug in the calendar was a Date being converted through the browser's or server's zone."
faq:
  - q: "Why did a punch at 11:50 pm land on the next day?"
    a: "The server in UTC computed the day from the timestamp. Convert to Asia/Kolkata first, then take the date part."
  - q: "Should attendance days be stored as Dates?"
    a: "No. A date-only value as a string cannot shift. Keep timestamps for punches and strings for days."
  - q: "How do I render a month grid safely?"
    a: "Generate the day strings for the month with Date.UTC arithmetic and look up attendance by string, never by comparing Date objects."
---

Everyone who builds an attendance system makes the same mistake once: storing the punch time as a JavaScript `Date`, then grouping by `getDate()`. It works on the developer's laptop and breaks on the server, because the server's clock is in UTC and a punch at 11:50 pm IST is 6:20 pm UTC, which is a different day in one place and the same day in the other.

Growth HR, the HRMS app for Growth Avenues, had exactly this bug in its first week. Here is the version that has been right since.

## The rule: a day is a string, a moment is a Date

Attendance has two different kinds of time:

- **The moment of a punch**: an instant. Store it as a `Date` (UTC in MongoDB), because you may need the exact time for late marks.
- **The attendance day**: a calendar date in the company's time zone. Store it as a string, `YYYY-MM-DD`, computed once at write time.

```js
import { formatInTimeZone } from "date-fns-tz";
const COMPANY_TZ = "Asia/Kolkata";

const now = new Date();
await Punch.create({
  employee: req.user.id,
  at: now,                                              // instant
  day: formatInTimeZone(now, COMPANY_TZ, "yyyy-MM-dd"), // calendar day
  kind: "in",
});
```

Every query for a day, a month, or a date range then compares strings. No time zone maths at read time, ever.

```js
Punch.find({ employee, day: { $gte: "2027-01-01", $lte: "2027-01-31" } });
```

India has no daylight saving, which spares you the worst of it, but the UTC-versus-local gap is still five and a half hours of wrong answers if you skip this.

## Deriving the day's status

One document per employee per day, recalculated when a punch or a request changes:

```js
async function recalcDay(employee, day) {
  const punches = await Punch.find({ employee, day }).sort({ at: 1 }).lean();
  const leave = await Leave.findOne({ employee, from: { $lte: day }, to: { $gte: day }, status: "approved" });
  const holiday = await Holiday.exists({ day });

  let status = "absent";
  if (holiday) status = "holiday";
  else if (leave) status = leave.halfDay ? "half" : "leave";
  else if (punches.length >= 2) {
    const hours = (punches.at(-1).at - punches[0].at) / 36e5;
    status = hours >= 7 ? "present" : hours >= 3.5 ? "half" : "absent";
  } else if (punches.length === 1) status = "incomplete";

  await Attendance.updateOne({ employee, day }, { status, firstIn: punches[0]?.at, lastOut: punches.at(-1)?.at }, { upsert: true });
}
```

Thresholds are company policy; put them in a settings document, not in code. HR changed the half-day rule twice in the first year.

## The month grid in React

Build the grid from the first day of the month in the company time zone, padding the leading weekdays, and look up each cell by its `YYYY-MM-DD` key:

```tsx
function MonthGrid({ year, month, days }: { year: number; month: number; days: Record<string, Attendance> }) {
  const first = new Date(Date.UTC(year, month - 1, 1));
  const lead = (first.getUTCDay() + 6) % 7;             // Monday-first
  const count = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: count }, (_, i) => i + 1)];

  return (
    <div className="grid grid-cols-7 gap-1">
      {cells.map((d, i) => {
        if (!d) return <div key={i} />;
        const key = `${year}-${String(month).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
        const a = days[key];
        return (
          <button key={key} className={`aspect-square rounded ${COLOR[a?.status ?? "none"]}`} aria-label={`${key}: ${a?.status ?? "no record"}`}>
            {d}
          </button>
        );
      })}
    </div>
  );
}
```

Using `Date.UTC` for the grid arithmetic keeps it independent of the browser's zone. The grid only cares which weekday the 1st falls on and how many days the month has; neither depends on where the user is.

## Showing times to people

Display the punch instants in the company zone, not the viewer's. A manager checking from a trip abroad should see the office time:

```ts
new Intl.DateTimeFormat("en-IN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(punch.at);
```

The same rule fixed a hydration mismatch on this portfolio, where the server rendered dates in UTC and browsers rendered them locally.

## Things that still catch people

- **Midnight shifts.** A punch-out at 1 am belongs to yesterday's shift. If the company runs night shifts, the `day` is the shift's start day, derived from the matching punch-in, not from the clock.
- **Phone clocks.** Never trust the device's time for a punch. The server stamps `at`.
- **Backfilling.** HR edits are separate documents with who, when and why. The calendar shows the result; the audit trail keeps the truth.

## Sources

- date-fns-tz `formatInTimeZone`: [github.com/marnusw/date-fns-tz](https://github.com/marnusw/date-fns-tz)
- `Intl.DateTimeFormat` with `timeZone`: [developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat)
- MongoDB date storage is UTC: [mongodb.com/docs/manual/reference/method/Date](https://www.mongodb.com/docs/manual/reference/method/Date/)
- Why calendar dates should be strings: the "tzdb" FAQ on floating dates, [iana.org/time-zones](https://www.iana.org/time-zones)
