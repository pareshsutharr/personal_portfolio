---
title: "What a stock broker's website has to keep publishing, and how I built it into the admin"
description: "Growth Avenues is a SEBI-regulated broker, so its website carries disclosures that change monthly. Rather than editing HTML every time, I built a compliance module into the back office. Here is what it holds, how it is structured, and what to check on your own broker or advisor site."
date: 2026-12-07T03:30:00Z
tags: [fintech, compliance, admin, react, nodejs]
keywords: [sebi stock broker website requirements, broker website disclosures, investor complaints data website, escalation matrix broker website, fintech compliance cms]
project: growth-avenues-admin
image: /blog/stock/market-3.webp
imageAlt: "Electronic stock price board in Tokyo"
imageCredit: "nappa"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Electronic_stock_board_in_Yaesu,_Tokyo_2007.jpg"
imageLicense: "CC BY 2.0"
---

A broker's website is not a brochure. SEBI and the exchanges expect certain information to be on it, kept current, and easy to find. Some of it changes every month. When I took over the Growth Avenues website, those pages were static HTML that someone had to edit by hand, which meant they were sometimes late and occasionally wrong.

I built a compliance module into the Growth Avenues admin so the operations and compliance team publish these themselves, on time, without a developer. This post is about what it holds and how it is built. It is not legal advice; the exact requirements come from the circulars I link at the end, and they change, so check the current ones.

## What the site has to carry

From the work on Growth Avenues, the disclosures the team maintains fall into a few groups:

- **Identity and registration.** Registered name and address, SEBI registration number, exchange membership details, contact details of the compliance officer.
- **Investor grievance information.** Where to complain, the escalation matrix with names and contacts at each level, and links to the exchange and SEBI complaint portals.
- **Complaint data.** A monthly table of complaints received, resolved and pending, in the format the exchanges prescribe.
- **Risk and policy documents.** Risk disclosure documents, policies and procedures, rights and obligations, and the standard investor charter.
- **Advisories.** Investor awareness notices and warnings against unauthorised schemes, which the exchanges update from time to time.

Each of these is a page or a section, and the monthly complaint table is the one that bites: it has a deadline every month.

## The structure in the admin

The back office is a React app on top of a Node.js and Express API, with MongoDB. The compliance module is three collections:

```
disclosures        one per page section: title, slug, body (rich text), documents[], updatedBy, updatedAt
complaint_months   one per month: month, received, resolved, pending, pendingOver30Days, publishedAt
escalation_levels  one per level: level, title, name, phone, email, workingHours
```

Each disclosure has a slug the public site renders at a fixed URL, so links from exchange portals and old emails keep working. Documents are PDFs in object storage; the record only holds the URL and the version date.

The public site reads from the same database over the API. When compliance publishes the month's complaint data in the admin, the public table updates within a minute. No developer, no deploy.

## Three things that made it work in practice

**Reminders with a deadline.** The admin dashboard shows "Complaint data for October: due in 4 days" until the month is published. It is a trivial query, `complaint_months` missing the current month, but it is the single feature the team mentions most.

**Versioning on documents.** Risk disclosure documents get revised. The admin keeps every uploaded version with its date. The public page shows the latest; the history is there when someone asks "what was live in March?".

**Role-based access.** Only the compliance role can publish disclosures. Content editors see the module but cannot change it. This was built on the same role middleware as the rest of the API, which I covered in the JWT and roles post.

## A checklist for your own site

If you run or build a site for a broker, a distributor or an advisor, walk through this:

1. Is the registration information on every page's footer, not just a buried page?
2. Can a visitor find "how to complain" within two clicks from the home page?
3. Is the complaint table for last month published, and is it dated?
4. Do the escalation contacts actually answer? Phone numbers rot.
5. Are the policy PDFs the current versions, with a visible date?
6. Does the site work with a screen reader and keyboard? Accessibility requirements for persons with disabilities apply here too, and the Growth Avenues site went through an audit for exactly this.

The last point surprised me most. Fixing contrast, focus states and alt text on a finance site is not optional polish; it was part of passing review.

## Sources

Go to the primary sources for the current rules; summaries like this one go stale.

- SEBI circulars and master circulars for stock brokers: [sebi.gov.in](https://www.sebi.gov.in/)
- NSE member compliance and investor service requirements: [nseindia.com](https://www.nseindia.com/)
- BSE member compliance: [bseindia.com](https://www.bseindia.com/)
- SEBI SCORES, the investor complaint platform: [scores.sebi.gov.in](https://scores.sebi.gov.in/)
- Web accessibility guidelines the audit referenced: [w3.org/WAI/standards-guidelines/wcag](https://www.w3.org/WAI/standards-guidelines/wcag/)
