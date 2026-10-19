---
title: "Generating PDFs in Node: Puppeteer for documents that look like web pages, pdfkit for everything else"
description: "Salary slips, invoices, KYC acknowledgements and a 40-page portfolio statement. I have built each with both tools. Puppeteer renders HTML and CSS so the slip can match the web view exactly; pdfkit draws primitives and runs in 30 MB. Which one for which document, and the setup that makes Puppeteer safe on a small VPS."
date: 2028-02-14T03:30:00Z
tags: [nodejs, pdf, puppeteer, reports]
keywords: [puppeteer vs pdfkit, generate pdf node.js, html to pdf node puppeteer, pdfkit invoice node, puppeteer vps memory]
project: growth-avenues-hrms
---

A PDF is a document that cannot be argued with, which is why every HR and finance feature eventually needs one. The two serious options in Node take opposite approaches, and picking the wrong one costs either weeks of layout code or a server that falls over.

## Puppeteer: render HTML, print to PDF

If the document already exists as a web page, or should look like one, this is the path. The salary slip in the HRMS is a React component rendered to a string on the server, styled with the same CSS as the on-screen version, and printed:

```js
import puppeteer from "puppeteer";

let browser;
async function getBrowser() {
  if (!browser || !browser.connected) {
    browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
  }
  return browser;
}

export async function htmlToPdf(html) {
  const page = await (await getBrowser()).newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0" });
    return await page.pdf({ format: "A4", printBackground: true, margin: { top: "16mm", bottom: "16mm", left: "14mm", right: "14mm" } });
  } finally {
    await page.close();
  }
}
```

One browser, reused across requests, one page per document, always closed. Launching a browser per request is the mistake that takes a 1 GB VPS down: Chrome is 150 MB before it renders anything.

The CSS for print lives in a `@media print` block and uses `page-break-inside: avoid` on table rows and `break-before: page` for section starts. Fonts are loaded from the local filesystem via `@font-face` with a `file://` path, so rendering does not depend on the network.

## Limits for Puppeteer on a small server

- **Concurrency.** A semaphore of two in-flight renders. A queue beyond that. Bulk jobs such as "generate all 300 salary slips" run through the queue one at a time from a worker, never from a request.
- **Timeouts.** `page.setContent` and `page.pdf` with 30 second limits, or a runaway page holds a slot forever.
- **Restart.** The browser is closed and relaunched every 200 documents. Chrome leaks a little; this is cheaper than finding out where.
- **Dependencies.** On Debian or Ubuntu, Chrome needs a list of shared libraries. The Puppeteer docs list them; install once, and bake them into the Docker image if containerised.

## pdfkit: draw it yourself

For documents that are mostly text and tables with a fixed layout, pdfkit is simpler to run and much lighter. The client's quarterly portfolio statement is 40 pages of tables and runs in a worker that never loads a browser:

```js
import PDFDocument from "pdfkit";

export function statementPdf(statement, out) {
  const doc = new PDFDocument({ size: "A4", margin: 48, bufferPages: true });
  doc.pipe(out);
  doc.registerFont("Body", "fonts/Inter-Regular.ttf").registerFont("Bold", "fonts/Inter-SemiBold.ttf");

  doc.font("Bold").fontSize(18).text("Portfolio statement").moveDown(0.3);
  doc.font("Body").fontSize(10).fillColor("#555").text(`${statement.client.name} · ${statement.period}`).moveDown();

  table(doc, { columns: [["Scheme", 220], ["Units", 80, "right"], ["NAV", 80, "right"], ["Value", 100, "right"]],
    rows: statement.holdings.map((h) => [h.scheme, fmt(h.units, 3), fmtInr(h.nav), fmtInr(h.value)]) });

  const pages = doc.bufferedPageRange();
  for (let i = 0; i < pages.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).fillColor("#888").text(`Page ${i + 1} of ${pages.count}`, 48, doc.page.height - 36, { align: "right" });
  }
  doc.end();
}
```

The `table` helper is about forty lines: it measures text, breaks rows across pages, and repeats the header. That is the cost of pdfkit: layout is yours to write. In exchange, a 40-page statement generates in under a second with no browser.

`bufferPages: true` is what makes "Page 3 of 12" possible, since the total is only known at the end.

## Which one

| Document | Tool | Why |
|---|---|---|
| Salary slip | Puppeteer | Must match the on-screen slip; styled with the app's CSS |
| Invoice | Puppeteer | Logo, brand colours, one page; HTML is faster to iterate |
| KYC acknowledgement | pdfkit | Plain text, a signature line, generated in bulk |
| Portfolio statement | pdfkit | 40 pages of tables; browser rendering would be slow and heavy |
| Report with charts | Puppeteer | Charts are SVG from the web app; drawing them in pdfkit is a project |

The deciding question: is layout fidelity to a web view the point, or is it a document with a fixed structure? The first wants a browser; the second does not.

## Serving and storing

Both produce a buffer or a stream. Short-lived documents stream straight to the response with `Content-Disposition: attachment`. Anything that must be retrievable later, like a salary slip, is written to object storage under a key that includes the period, and served through a presigned URL after a permission check, as in the uploads post.

## Sources

- Puppeteer `page.pdf`: [pptr.dev/api/puppeteer.page.pdf](https://pptr.dev/api/puppeteer.page.pdf)
- Puppeteer on Linux, required dependencies: [pptr.dev/troubleshooting#chrome-doesnt-launch-on-linux](https://pptr.dev/troubleshooting#chrome-doesnt-launch-on-linux)
- pdfkit: [pdfkit.org](https://pdfkit.org/)
- CSS paged media and page breaks: [developer.mozilla.org/en-US/docs/Web/CSS/break-inside](https://developer.mozilla.org/en-US/docs/Web/CSS/break-inside)
