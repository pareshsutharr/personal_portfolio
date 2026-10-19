---
title: "Estimating freelance development work without losing money: the method I settled on after getting it wrong three times"
description: "Three projects, three bad estimates: one too low by half, one that doubled in scope with no change in price, one quoted by the hour that the client could not budget for. The method now: a scoped discovery first, a breakdown into deliverables, a range not a number, and a change process agreed before the first invoice. With the actual spreadsheet columns."
date: 2028-06-26T03:30:00Z
tags: [freelancing, estimation, business, career]
keywords: [how to estimate freelance development project, software project estimation freelance, fixed price vs hourly freelance developer, scope creep freelance contract, discovery phase freelance]
project: portfolio
---

Estimation is the skill that decides whether freelance work is a living or a hobby that pays. I got it wrong in three different ways before finding a method that has held for two years. The method is not clever; it is a sequence that stops me from quoting before I know what I am quoting.

## The three mistakes

**Quoted from a one-line brief.** "An HR system for 300 employees" became a number on a call. The number was half of what the work took. The lesson: no price until the scope is written down.

**Fixed price with no change process.** The scope grew weekly, each addition was small, and the price was fixed. The lesson: changes are normal and need a path that includes money.

**Hourly, for a client who needed a budget.** Fair for me, impossible for them to approve internally. The lesson: match the pricing model to how the client makes decisions.

## The method

### 1. Paid discovery, one to two weeks

Before any build estimate, a short fixed-price engagement: conversations with the people who will use the system, a look at existing data and tools, and a written document listing what the system does in plain language, module by module. The client owns the document and can take it to anyone. Charging for it filters out people who are not serious, and it is the only way to produce a number I will stand behind.

### 2. Break it into deliverables, not tasks

The document becomes a list of things the client can see and sign off, each with a rough size:

| Deliverable | Size | Days | Notes |
|---|---|---|---|
| Employee directory and profiles | M | 6 | Import from existing sheet |
| Attendance from biometric devices | L | 12 | Two device models; vendor API unclear |
| Leave requests and approvals | M | 7 | Two-level approval |
| Salary slips (PDF, email) | M | 6 | Formula from their Excel |
| Admin reports and exports | S | 4 | Five reports, Excel |
| Deployment, backups, handover | S | 4 | VPS, documentation |

Sizes map to day ranges from previous projects. Tasks like "set up auth" are not listed; they are inside the deliverables they serve. The client can see where the money goes and can cut a row.

### 3. A range, with the risks that widen it

Sum the days, then give a range: the sum as the low end, and the low end plus the risk allowance as the high. The allowance is explicit: "Attendance is 12 to 18 days because the second device's API is undocumented". A single number invites negotiation on the number; a range with reasons invites a conversation about reducing the risk, which is what should happen.

### 4. Price the range, and set the payment schedule

Day rate times days gives the range in money. Payment is tied to deliverables: a percentage on signing, then on each milestone the client has accepted, with the final payment on handover. Monthly invoicing for anything longer than two months, so neither side carries too much.

### 5. The change process, agreed up front

In the proposal, one paragraph: any request outside the scope document is estimated as its own small row, added to the schedule, and approved in writing before it is built. Small things under a threshold are absorbed. This paragraph has ended more awkward conversations before they started than anything else I have written.

## Fixed price or time and materials

Fixed price per deliverable when the discovery was done and the scope is clear. Time and materials, with a monthly cap, when the work is exploratory, or ongoing maintenance, or when the client's own team is involved and their pace affects mine. Hourly with no cap is something I no longer offer.

## The spreadsheet

Columns: deliverable, size, low days, high days, risk note, dependencies, rate, low price, high price, milestone. A second sheet logs actual days per deliverable as the project runs, which is where the size-to-days mapping for the next project comes from. After a few projects the mapping is reliable, and that is the whole trick: estimates are only as good as the record of how long things really took.

## The numbers from two years

Projects estimated this way have landed inside the range every time but one, which went over by about fifteen percent because of a payment gateway's sandbox being down for a week. The ones estimated before this method ranged from forty percent under to one hundred percent over. Discovery is the step that changed that.

## Sources

- Steve McConnell, Software Estimation: Demystifying the Black Art, the standard reference on ranges and cone of uncertainty: [stevemcconnell.com/books](https://stevemcconnell.com/books/)
- The planning fallacy, and why single numbers are wrong: [en.wikipedia.org/wiki/Planning_fallacy](https://en.wikipedia.org/wiki/Planning_fallacy)
- Three-point estimation: [en.wikipedia.org/wiki/Three-point_estimation](https://en.wikipedia.org/wiki/Three-point_estimation)
