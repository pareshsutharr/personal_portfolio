---
title: "Expense claims and leave requests: states, approvals, and an audit trail that holds up"
description: "The approval flows in the Growth Avenues HRMS started as a status field and an if statement. They ended as a small state machine with named transitions and an append-only history. What changed, why, and the code."
date: 2027-08-02T03:30:00Z
tags: [workflow, hrms, mongodb, nodejs, design]
keywords: [approval workflow design, state machine node.js, leave request approval system, audit trail mongodb, expense claim workflow]
project: growth-avenues-hrms
---

An expense claim goes: submitted, reviewed by the manager, approved or sent back, paid by accounts. A leave request is similar with fewer steps. The first version of each was a `status` string and handlers that set it. Within months there were claims in impossible states and nobody could say who approved what. The fix was to name the transitions and record every one.

## Define the machine, not the statuses

```js
export const CLAIM = {
  states: ["draft", "submitted", "approved", "returned", "paid", "cancelled"],
  transitions: {
    submit:  { from: ["draft", "returned"], to: "submitted", by: ["owner"] },
    approve: { from: ["submitted"],         to: "approved",  by: ["manager"] },
    return:  { from: ["submitted"],         to: "returned",  by: ["manager"], note: "required" },
    pay:     { from: ["approved"],          to: "paid",      by: ["accounts"] },
    cancel:  { from: ["draft", "returned"], to: "cancelled", by: ["owner"] },
  },
};
```

Everything the system allows is in that object. A manager cannot pay; accounts cannot approve; nobody can approve a draft. Adding a step, like a second approval above a threshold, is a new transition, not a new `if` in four handlers.

## One function applies transitions

```js
export async function transition(model, machine, id, action, actor, { note } = {}) {
  const t = machine.transitions[action];
  if (!t) throw new HttpError(400, `Unknown action ${action}`);
  const doc = await model.findById(id);
  if (!doc) throw new HttpError(404);
  if (!t.from.includes(doc.status)) throw new HttpError(409, `Cannot ${action} a ${doc.status} claim`);
  if (!t.by.some((role) => actorHasRole(actor, role, doc))) throw new HttpError(403);
  if (t.note === "required" && !note?.trim()) throw new HttpError(400, "A note is required");

  const prev = doc.status;
  doc.status = t.to;
  doc.history.push({ action, from: prev, to: t.to, by: actor.id, note: note ?? null, at: new Date() });
  await doc.save();
  await afterTransition(machine, doc, action, actor);    // notifications, side effects
  return doc;
}
```

`actorHasRole` resolves "manager" to "this claim's owner's manager" and "owner" to "the person who submitted it". Roles in the machine are relative to the document, not global job titles, which is what makes one machine serve every team.

The 409 for a wrong-state action matters in practice: two managers opening the same claim and both clicking approve produces one approval and one clear error, not two history entries.

## The history is the audit trail

```js
history: [{ action: String, from: String, to: String, by: ObjectId, note: String, at: Date }]
```

Append-only. Nothing edits or deletes an entry, including admins. The UI shows it as a timeline under the claim: "Submitted by Priya, 3 Aug 10:12. Returned by Rahul, 3 Aug 14:40: receipt missing. Submitted by Priya, 4 Aug 09:05. Approved by Rahul, 4 Aug 09:30. Paid by Accounts, 7 Aug."

When an auditor asked for every claim approved by one manager in a quarter, it was one query on `history.by` and `history.action`.

## Side effects live outside the transition

Notifications, emails, and the accounts export are triggered after the save in `afterTransition`, keyed by `${machine}:${action}`. They can fail without undoing the transition, and they are retried by a job rather than by the user clicking again. The transition itself does one thing: change state and record it.

## The UI follows the machine

The buttons on a claim are computed, not hard-coded:

```js
export function availableActions(machine, doc, actor) {
  return Object.entries(machine.transitions)
    .filter(([, t]) => t.from.includes(doc.status) && t.by.some((r) => actorHasRole(actor, r, doc)))
    .map(([name]) => name);
}
```

A manager sees Approve and Return on a submitted claim and nothing on a paid one. When the machine changes, the screen changes with it.

## Sources

- The state pattern and finite state machines, a readable introduction: [refactoring.guru/design-patterns/state](https://refactoring.guru/design-patterns/state)
- XState, if the machines grow beyond a plain object: [stately.ai/docs](https://stately.ai/docs)
- HTTP 409 Conflict: [developer.mozilla.org/en-US/docs/Web/HTTP/Status/409](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/409)
- Mongoose subdocument arrays: [mongoosejs.com/docs/subdocs.html](https://mongoosejs.com/docs/subdocs.html)
