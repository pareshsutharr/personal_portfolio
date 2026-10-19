---
title: "Handing over a project so it survives without you: the runbook, the access checklist, and the two-hour walkthrough"
description: "A project is not finished when it is deployed. It is finished when someone else can run it. The handover package I deliver with every project: a runbook that answers 'what do I do when', an access list with the client as owner of everything, a recorded walkthrough, and a thirty-day window. What is in each, and the question that revealed what I had been leaving out."
date: 2028-07-10T03:30:00Z
tags: [freelancing, documentation, deployment, operations]
keywords: [project handover checklist developer, software handover documentation, runbook template small project, developer offboarding client project, handover freelance web project]
project: growth-avenues
image: /blog/stock/folders-1.webp
imageAlt: "Stack of paper documents"
imageCredit: "Niklas Bildhauer (who also is User gerolsteiner91."
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:FileStack.jpg"
imageLicense: "CC BY-SA 2.0"
---

A client once asked, six months after a project ended, "what happens if you are unreachable and the site goes down?" The honest answer at the time was "someone would have to figure it out". It is now "open the runbook, page 2". Everything below exists because of that question.

## 1. The runbook

A single Markdown file in the repository, `RUNBOOK.md`, written for a competent developer who has never seen the project. It is organised by situation, not by component:

```
## The site is down
1. Check https://status.vercel.com (or: ssh in, `pm2 status`)
2. ...
## A deploy went wrong
## I need to restore the database
## I need to rotate a secret
## An email is not being delivered
## The SSL certificate expired
## Monthly tasks
## Where everything is
```

Each section is a numbered list with exact commands. The restore section has been tested by actually restoring to staging, with the date of the test written next to it. A runbook step that has never been run is a guess.

"Where everything is" lists each service, what it is for, and who is the account owner: hosting, DNS, database, object storage, email provider, SMS provider, payment gateway, error tracking, uptime monitor, source repository.

## 2. The access checklist

A table, filled in together with the client on the handover call:

| Service | Account owner | My access | Removed on |
|---|---|---|---|
| Vercel project | client@… | Member | 2028-07-10 |
| Supabase project | client@… | Member | 2028-07-10 |
| Domain registrar | client@… | None | — |
| GitHub repository | client org | Collaborator | 2028-08-10 (end of warranty) |
| Gmail SMTP app password | client@… | None | — |

The client owns every account; that was set up at the start per the contract. The handover is the moment my access is removed, with repository access kept until the warranty ends. Every secret I ever had is rotated during handover, so nothing in my password manager works afterwards. That protects the client, and it protects me.

## 3. Environment and secrets inventory

`.env.example` in the repository lists every variable with a one-line description and where to get a new value. The actual values live in the client's hosting dashboard and password manager, not in a file I send them. The runbook's "rotate a secret" section says which variables are safe to change without downtime and which need a coordinated restart.

## 4. The recorded walkthrough

A two-hour screen recording, in three parts: the admin side as a user would see it, the codebase as a developer would, and the operations as the runbook describes. Recorded rather than live so the next developer, whoever they are, gets the same walkthrough. The client keeps the file. Transcripts are generated and attached, because nobody searches a video.

## 5. The known issues and the backlog

A short honest list: things that are slower than they should be, the one report that times out on the full year, the mobile layout of one page. And the backlog of ideas that came up and were out of scope, so the next developer does not start by re-discovering them. Both go in `docs/` in the repository.

## 6. The thirty days

The warranty period from the contract. During it, defects are fixed at no charge and questions are answered. At the end, a short call: anything outstanding, a reminder of where the runbook is, and whether they want a maintenance retainer. Most do, for a few hours a month, which is the arrangement that keeps a project healthy.

## What a maintainer actually needed

Six months after one handover, a developer the client hired asked me three things, in this order: where are the backups, how do I deploy, and why is the attendance calculation like that. The first two were in the runbook. The third was in a blog post on this site, which is one reason the posts exist. A fourth question, "what version of Node", was answered by `.nvmrc`, which had been there all along.

## The checklist

- [ ] `RUNBOOK.md` with tested restore steps
- [ ] `.env.example` complete
- [ ] Access table filled in, client owns everything
- [ ] All secrets rotated
- [ ] Walkthrough recorded and transcribed
- [ ] Known issues and backlog written
- [ ] Backups verified from the client's own access
- [ ] Uptime monitor alerts go to the client
- [ ] Warranty end date in both calendars

Nine lines, and the last project took four hours to complete all of them. It is the cheapest insurance either side can buy.

## Sources

- Google SRE on runbooks and playbooks: [sre.google/sre-book/monitoring-distributed-systems](https://sre.google/sre-book/monitoring-distributed-systems/)
- The "bus factor": [en.wikipedia.org/wiki/Bus_factor](https://en.wikipedia.org/wiki/Bus_factor)
- Write the Docs on documentation for handover: [writethedocs.org/guide](https://www.writethedocs.org/guide/)
