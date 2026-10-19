---
title: "The Growth Avenues platform after two years: what runs, what it costs, and the plan for the next two"
description: "The HRMS, the CRM, the client portal and the public site have been live for two years on one VPS and a few managed services. An honest account of what it costs to run, what has broken, what the client asked for that was declined, and the roadmap we agreed for the next two years: consolidation, a reporting layer, and the three things that will finally need a second server."
date: 2028-10-09T03:30:00Z
tags: [case-study, architecture, planning, growth-avenues, operations]
keywords: [small business software platform two years, hrms crm portal architecture review, vps running costs small business, technical roadmap small client, software maintenance retainer results]
project: growth-avenues
---

Most of the posts in this series come from one platform: the systems built for Growth Avenues, a financial services firm in Surat. Two years after the first module went live, this is the review the client and I did together, with the parts that are useful to anyone running software for a business of a few hundred people.

## What runs

| System | Users | Since | Stack |
|---|---|---|---|
| Public website | Public | 2026 | Next.js on Vercel, Supabase |
| Client portal | ~2,400 clients, ~60 distributors | 2026 | React, Express, MongoDB |
| CRM and lead desk | ~40 staff | 2027 | React, Express, MongoDB, Meilisearch |
| HRMS | ~300 employees | 2027 | React, Express, MongoDB, biometric integration |
| Mobile app (portal and HRMS) | Field staff and clients | 2027 | Capacitor over the web apps |

One VPS, 8 GB, runs the API processes, MongoDB, Redis, Meilisearch and Nginx, with staging alongside. Object storage, transactional email, SMS and the payment gateway are managed services.

## What it costs

Running costs, per month, roughly: the VPS, object storage, email and SMS volume, a domain or two, and the error tracker's free tier. Under ₹8,000 a month for everything that serves 2,700 people. The maintenance retainer, a fixed number of my hours per month, is the larger line and covers updates, the quarterly recovery drill, and small changes.

The client's previous arrangement was three separate SaaS subscriptions that did parts of this and did not talk to each other. The platform paid for its own build cost against those within the first eighteen months.

## What has broken

In two years, with the uptime monitor as witness:

- Four outages over fifteen minutes. One VPS provider incident, one disk full from the log rotation gap described in the monitoring post, one bad deploy rolled back in eight minutes, one MongoDB restart that took longer than expected after a kernel update.
- The credential-stuffing incident from the login post, four accounts, no financial loss, 2FA mandated after.
- A biometric vendor firmware update that changed the punch format, caught by the nightly sync check, fixed the same day.

Nothing lost. Every incident has a post in this series, which is partly why the series exists.

## What was declined

Things the client asked for that I argued against, and why:

- **A chatbot on the portal.** The questions it would answer are answered by the statements page; the ones it could not need a human. Declined in favour of making the statements page clearer, which halved support calls.
- **Real-time NAV on the portal.** The data feed costs more than the feature is worth to clients who check monthly. Daily is fine and is what they have.
- **Moving everything to a cloud provider's managed everything.** Would multiply the running cost by about six for a reliability improvement the client would not notice at this scale. Revisited below, because the answer changes with growth.

Saying no with reasons is part of the job, and these three are in the agreement's record so the reasoning survives me.

## The plan for the next two years

Agreed with the client, in priority order:

**1. Consolidate the three apps into one.** The portal, CRM and HRMS share users, auth and a design system but are three codebases. A monorepo with shared packages, one login, one admin shell. Mostly refactoring, done behind feature flags, no visible change to users until the shared navigation lands. Six months of retainer time.

**2. A reporting layer.** The exports are the reporting today. A reporting module with saved views, scheduled delivery, and a few charts, reading from a nightly-refreshed reporting database so heavy queries never touch the live one. This is the feature the management team asks for most.

**3. The second server.** Three things will need it: MongoDB on its own box once the working set exceeds the current RAM, which the trend says is about a year away; a dedicated worker box for PDFs and exports at year-end volumes; and a real standby for the API. At that point, managed MongoDB becomes the right trade and the "declined" answer above changes. The recovery drill becomes a failover drill.

**4. Keep the blog going.** Not for the client, for me, but the client has started pointing new hires at the HRMS posts as onboarding, which was not the plan and is the best review the writing has had.

## What I would tell someone starting the same thing

Build the smallest module that removes a real daily pain, ship it, and let the second module be whatever the first one's users ask for most. Run it on infrastructure you can rebuild from a script. Write down every decision somewhere the next person will find it. And keep a list of what you said no to, with the reasons, because in two years someone will ask again and the reasons may have changed.

## Sources

- The posts in this series, which are the detailed record: [the blog index](/blog)
- Google SRE on postmortems and the blameless record: [sre.google/sre-book/postmortem-culture](https://sre.google/sre-book/postmortem-culture/)
- Basecamp's "Getting Real" on building less: [basecamp.com/gettingreal](https://basecamp.com/gettingreal)
