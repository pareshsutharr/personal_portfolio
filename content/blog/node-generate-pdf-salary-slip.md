---
title: "Salary slip PDFs from Node.js: templates, fonts and Indian number formatting"
description: "Growth HR generates a salary slip PDF for every employee every month. The first version had wrong rupee symbols, numbers in thousands instead of lakhs, and a layout that broke on long names. This is the version that holds up."
date: 2027-01-25T03:30:00Z
tags: [nodejs, pdf, hrms, javascript]
keywords: [node generate pdf, pdfkit salary slip, puppeteer html to pdf node, indian rupee number format javascript, lakh crore format intl]
project: growth-avenues-hrms
image: /blog/stock/folders-1.webp
imageAlt: "Stack of paper documents"
imageCredit: "Niklas Bildhauer (who also is User gerolsteiner91."
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:FileStack.jpg"
imageLicense: "CC BY-SA 2.0"
---

A salary slip is the one document from an HRMS that employees keep, print and send to banks. It has to be right every time. The HRMS for Growth Avenues generates one per employee per month, and getting it right took three attempts. The decisions that mattered were which tool to render with, how to format money, and how to make the layout survive real data.

## HTML to PDF, not drawing by hand

There are two ways to make a PDF in Node. `pdfkit` draws text and lines at coordinates; it is light and fast, and every layout change is arithmetic. Puppeteer renders an HTML page with headless Chrome and prints it; it is heavier, and every layout change is CSS.

I started with pdfkit and rewrote with Puppeteer after the second layout request from HR. A salary slip is a table with a header and a footer, and CSS is simply the better tool for tables.

```js
import puppeteer from "puppeteer";

export async function renderPdf(html) {
  const browser = await puppeteer.launch({ args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({ format: "A4", printBackground: true, margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" } });
  } finally {
    await browser.close();
  }
}
```

Launching Chrome per request is slow, about a second. For monthly batches I launch once, open a page per slip, and close at the end. For a single on-demand download, a second is fine.

## Money in Indian format

`toLocaleString("en-IN")` gets the grouping right: `12,34,567.00`, not `1,234,567.00`. Use `Intl.NumberFormat` once and reuse it:

```js
const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
inr.format(1234567); // "₹12,34,567.00"
```

Two traps. The rupee symbol needs a font that has it; the default fonts in headless Chrome on a bare Ubuntu server do not, and you get a box. Install a font with the glyph and reference it from the template:

```bash
sudo apt-get install -y fonts-noto-core
```

```css
body { font-family: "Noto Sans", sans-serif; }
```

And amounts in words, which Indian slips usually carry, must use the lakh and crore system. I wrote a small function rather than pulling a package that spoke only in millions:

```js
const ones = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
const tens = ["", "", "twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];
const two = (n) => (n < 20 ? ones[n] : `${tens[Math.floor(n / 10)]}${n % 10 ? " " + ones[n % 10] : ""}`);
const three = (n) => (n >= 100 ? `${ones[Math.floor(n / 100)]} hundred${n % 100 ? " " + two(n % 100) : ""}` : two(n));

export function rupeesInWords(amount) {
  let n = Math.round(amount);
  const parts = [];
  if (n >= 1e7) { parts.push(`${two(Math.floor(n / 1e7))} crore`); n %= 1e7; }
  if (n >= 1e5) { parts.push(`${two(Math.floor(n / 1e5))} lakh`); n %= 1e5; }
  if (n >= 1e3) { parts.push(`${two(Math.floor(n / 1e3))} thousand`); n %= 1e3; }
  if (n > 0) parts.push(three(n));
  return `Rupees ${parts.join(" ") || "zero"} only`;
}
```

## A template that survives real data

The first layout broke on a name with 34 characters and on an employee with nine allowance lines. Rules that fixed it:

- Fixed column widths with `table-layout: fixed` and `word-break: break-word`, so a long name wraps instead of pushing columns.
- Earnings and deductions as two separate tables side by side with `vertical-align: top`, so unequal row counts do not misalign totals.
- Totals computed in code and passed to the template, never summed in the template. One source of truth.
- `page-break-inside: avoid` on the slip wrapper, so a slip is never split across pages in a batch.

Render the HTML with any template engine. I use plain template literals with an escape function; the data is numbers and names, not user-supplied HTML, but escape anyway.

## Storing and serving

Generate once, store the PDF in object storage keyed by employee and month, and serve from there. Regeneration happens only when HR corrects a figure, which also writes an audit entry. Employees download from the app; the file never travels through email.

## Sources

- Puppeteer `page.pdf`: [pptr.dev/api/puppeteer.page.pdf](https://pptr.dev/api/puppeteer.page.pdf)
- `Intl.NumberFormat` with the `en-IN` locale: [developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- CSS paged media, `page-break-inside`: [developer.mozilla.org/en-US/docs/Web/CSS/break-inside](https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside)
- Noto fonts: [fonts.google.com/noto](https://fonts.google.com/noto)
