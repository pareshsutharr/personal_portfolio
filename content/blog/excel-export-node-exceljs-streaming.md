---
title: "Excel exports from Node that do not hang the server: ExcelJS, streaming, and the Indian number format"
description: "'Export to Excel' is the most-used button in every admin I have built. The first version loaded 80,000 rows into memory, took 40 seconds and crashed twice. The current one streams, finishes in four seconds, and formats rupees the way the accounts team expects. The code and the three formatting details that caused the most questions."
date: 2028-02-07T03:30:00Z
tags: [nodejs, excel, exports, express, performance]
keywords: [exceljs streaming export node, export large data to excel node.js, excel export express stream response, exceljs number format indian rupees, generate xlsx node]
project: growth-avenues-hrms
image: /blog/stock/folders-1.webp
imageAlt: "Stack of paper documents"
imageCredit: "Niklas Bildhauer (who also is User gerolsteiner91."
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:FileStack.jpg"
imageLicense: "CC BY-SA 2.0"
summary: "Stream rows from a Mongoose cursor into ExcelJS's streaming workbook writer so memory stays flat for any number of rows, write dates as Dates and numbers as numbers with number formats, and use a conditional format mask for lakh and crore grouping. Very large exports move to a background job with a download link."
faq:
  - q: "Why does my Excel export crash the server on big reports?"
    a: "Loading every row into memory before writing. Use the ExcelJS streaming writer with a database cursor and commit each row as it is written."
  - q: "How do I get Indian number grouping like 12,34,567 in Excel?"
    a: "A conditional number format with sections for crores, lakhs and below, applied as the column's numFmt."
  - q: "Why do my dates show as text in Excel?"
    a: "They were written as strings. Write JavaScript Date objects and set a date numFmt on the column so Excel can sort and filter them."
---

The accounts team at a client exports the salary register every month, the attendance report every week, and the expense claims whenever someone asks. The export is where the HRMS data meets the rest of the company, so it has to work, and work for a year's worth of rows.

## Stream it

ExcelJS has a streaming workbook writer that writes rows to the response as they are produced, so memory stays flat no matter how many rows:

```js
import ExcelJS from "exceljs";

router.get("/reports/attendance.xlsx", requireRole("hr"), async (req, res) => {
  const { from, to, department } = req.validated.query;
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="attendance-${from}-to-${to}.xlsx"`);

  const wb = new ExcelJS.stream.xlsx.WorkbookWriter({ stream: res, useStyles: true });
  const ws = wb.addWorksheet("Attendance");
  ws.columns = [
    { header: "Employee code", key: "code", width: 14 },
    { header: "Name", key: "name", width: 28 },
    { header: "Department", key: "department", width: 18 },
    { header: "Date", key: "day", width: 12, style: { numFmt: "dd-mmm-yyyy" } },
    { header: "In", key: "in", width: 8 },
    { header: "Out", key: "out", width: 8 },
    { header: "Hours", key: "hours", width: 8, style: { numFmt: "0.00" } },
    { header: "Status", key: "status", width: 10 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  const cursor = Attendance.find(filter(from, to, department)).sort({ day: 1, code: 1 }).lean().cursor();
  for await (const a of cursor) {
    ws.addRow({ code: a.employeeCode, name: a.employeeName, department: a.departmentName,
      day: parseDay(a.day), in: a.firstIn, out: a.lastOut, hours: a.workedMinutes / 60, status: a.status }).commit();
  }
  ws.commit();
  await wb.commit();
});
```

A Mongoose cursor on one side, a streaming writer on the other, and each row is committed as it is written. The 80,000-row export runs in about four seconds and the process memory never rises above its idle level.

## Dates must be dates

The first exports wrote `"2028-02-03"` as a string. Excel showed it left-aligned and would not sort or filter by month. Write a JavaScript `Date` and set `numFmt` on the column; Excel then treats it as a date. The `parseDay` helper builds the date at midnight so the time zone does not shift it by a day:

```js
const parseDay = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(Date.UTC(y, m - 1, d)); };
```

## Numbers must be numbers

Hours as `"7.5"` is a string Excel cannot sum. Hours as `7.5` with `numFmt: "0.00"` is a number that displays as `7.50`. Same for amounts: write the number, format with a mask.

## The Indian rupee format

`₹12,34,567.00` groups digits in twos after the first three. Excel's default `#,##0.00` gives `1,234,567.00`, which the accounts team flagged on day one. The mask that produces lakh grouping:

```js
{ header: "Net pay", key: "net", width: 14, style: { numFmt: '[>=10000000]"₹"##\\,##\\,##\\,##0.00;[>=100000]"₹"##\\,##\\,##0.00;"₹"##,##0.00' } }
```

Three conditional sections for crores, lakhs, and below. It is ugly and it is what works in both Excel and LibreOffice.

## Headers that survive scrolling and filters that are ready

`ws.views = [{ state: "frozen", ySplit: 1 }]` pins the header. `ws.autoFilter = "A1:H1"` adds the filter dropdowns. These two lines removed most of the "can you add…" requests.

## Large exports go to a job

Above a few hundred thousand rows, or when the query itself takes more than a few seconds, the request should not hold a connection. The pattern becomes: `POST /reports/attendance` creates a job, a worker streams the file to object storage with the same code, and the person gets an email with a presigned download link. The response-streaming version serves the common case; the job version serves the year-end case.

## CSV when Excel is not needed

If the destination is another system rather than a person, a CSV is faster to produce and to consume. A streaming CSV is a `for await` loop writing lines to `res`, with values quoted and the BOM prefix `﻿` so that Excel opens it with the right encoding. Hindi names without the BOM came out as question marks.

## Sources

- ExcelJS streaming writer: [github.com/exceljs/exceljs#streaming-xlsx-writercontents](https://github.com/exceljs/exceljs#streaming-xlsx-writercontents)
- ExcelJS number formats: [github.com/exceljs/exceljs#number-formats](https://github.com/exceljs/exceljs#number-formats)
- Excel custom number format syntax: [support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68](https://support.microsoft.com/en-us/office/number-format-codes-5026bbd6-04bc-48cd-bf33-80f18b4eae68)
- Mongoose cursors: [mongoosejs.com/docs/api/query.html#Query.prototype.cursor()](https://mongoosejs.com/docs/api/query.html#Query.prototype.cursor())
