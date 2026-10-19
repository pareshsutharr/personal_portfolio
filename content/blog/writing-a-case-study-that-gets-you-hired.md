---
title: "Writing a project case study that gets you hired: the structure I use for every project on this site"
description: "A list of technologies is not a case study. The work pages on this site follow one structure: the situation, the constraint, what I built, what changed, and what I would do differently. Why each part is there, what to leave out, how to write about a project under NDA, and the two case studies that have brought the most enquiries."
date: 2028-06-19T03:30:00Z
tags: [portfolio, writing, freelancing, career]
keywords: [how to write a project case study developer, portfolio case study structure, developer portfolio writing, case study nda project, freelance portfolio projects]
project: portfolio
---

The projects on this site used to be screenshots with a tech-stack list underneath. They got views and no messages. Rewriting them as case studies, each answering the questions a client actually has, is the change that made the contact form start working. The structure is below, and it is the same for a two-week landing page and a two-year HRMS.

## The structure

**1. Who, and what they needed.** Two sentences. "Growth Avenues is a financial services firm in Surat with a distributor network. They needed a client portal that their distributors could onboard clients through without the office re-entering everything." The reader now knows whether this is like their situation.

**2. The constraint.** The thing that made it hard. Budget, deadline, legacy data, regulation, a team of one. "The existing client data was in Tally exports and three spreadsheets with no shared ids." Every project has one, and it is what makes the rest of the story credible.

**3. What was built, in terms of outcomes.** Not "React, Node, MongoDB". Rather: "Distributors onboard a client in about four minutes on a phone, including KYC uploads. The office sees new onboardings in a queue and approves them. Monthly statements are generated and emailed automatically." Then the stack, in one line, because the reader will want it but it is not the point.

**4. One or two decisions worth explaining.** The interesting part for a technical reader, and the part that shows judgement. "Uploads go straight to object storage with presigned URLs so the API is never the bottleneck during onboarding drives." Link to the blog post that goes deeper. This is where the blog and the case studies feed each other.

**5. What changed.** A number if there is one and it is honest. "Onboarding went from two days to the same afternoon." "Support calls about statements dropped to near zero." If there is no number, a quote from the client, or a plain description of what is different now.

**6. What I would do differently.** One paragraph. This is the section people say to leave out, and it is the one clients mention in the first call. It says the writer can see their own work clearly.

## What to leave out

- The full feature list. Nobody reads it, and it makes small projects look padded.
- The generic "challenges" paragraph that could be about any project.
- Screenshots of every page. Two or three, chosen for the moments that matter: the onboarding form on a phone, the approval queue.
- Stack logos.

## Projects under NDA

Most client work has some restriction. What is usually fine: the industry, the shape of the problem, the architecture, the outcomes in rough terms. What is usually not: the client's name, real data in screenshots, specific numbers. Ask; clients often agree to a named case study once the project is stable, and a named one is worth three anonymous ones. For the rest, "a financial services firm in Gujarat" is a perfectly good subject, and screenshots can use seeded demo data, which is also what the staging environment runs on.

## Length

Four hundred to eight hundred words. The HRMS case study is the longest on the site at about nine hundred, because there is a lot to show. A landing page project is three hundred and that is fine. A case study that is long because it is thorough is good; one that is long because it is vague is the one people close.

## The two that bring enquiries

The HRMS and the client portal, by a wide margin, and for the same reason: they describe a business problem that other businesses recognise. Enquiries mention them by name: "we have something like the attendance problem you wrote about". Nobody has ever mentioned a tech stack.

## Keeping them current

Each case study has an "updated" date and gets a short addition when something material happens: a new module, a year of operation, a number that improved. A case study that says "live since 2026, 300 employees, still running" tells a different story from one frozen at launch.

## Sources

- Nielsen Norman Group on how people read on the web: [nngroup.com/articles/how-users-read-on-the-web](https://www.nngroup.com/articles/how-users-read-on-the-web/)
- The STAR structure, which this is a version of: [en.wikipedia.org/wiki/Situation,_task,_action,_result](https://en.wikipedia.org/wiki/Situation,_task,_action,_result)
- Google's guidance on helpful, people-first content: [developers.google.com/search/docs/fundamentals/creating-helpful-content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)
