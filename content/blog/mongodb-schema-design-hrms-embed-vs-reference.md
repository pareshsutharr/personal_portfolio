---
title: "MongoDB schema design for an HRMS: what to embed, what to reference, and what I changed later"
description: "Employees, departments, attendance, leave, expenses, salary slips. The Growth Avenues HRMS schema went through two revisions. The decisions that held, the two that did not, and the rule of thumb that would have saved the second revision."
date: 2027-11-08T03:30:00Z
tags: [mongodb, mongoose, schema, hrms, data-modeling]
keywords: [mongodb schema design embed vs reference, mongoose schema hrms, mongodb data modeling one to many, mongodb unbounded array, document database design]
project: growth-avenues-hrms
image: /blog/stock/checklist-1.webp
imageAlt: "Clipboards with paper checklists"
imageCredit: "Unknown"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:USMC-100914-M-0646Q-45.jpg"
imageLicense: "Public domain"
summary: "Embed data that is small, bounded and always read with its parent; reference data that grows without limit, is queried on its own or is shared. Attendance and leave balances in the HRMS were the two embedded designs that had to be moved to their own collections."
faq:
  - q: "When should I embed instead of reference in MongoDB?"
    a: "Embed when the child is small, has a fixed upper bound and is always read with the parent, such as an address or a short approval history. Otherwise reference."
  - q: "Why not store attendance as an array on the employee?"
    a: "It grows forever, every read of the employee gets slower, and cross-company queries such as who is present today cannot use an index. One document per employee per day fixes both."
  - q: "Is copying the department onto attendance records a mistake?"
    a: "No. The historical value is what reports need, so a small, rarely changing field copied at write time avoids a join and stays correct after transfers."
---

The question in every MongoDB schema is the same: put this inside that document, or in its own collection with a reference? The HRMS has a dozen entity types, and I got about ten of them right the first time. The two I got wrong were the two that grow without bound. Here is the shape it settled into and why.

## The rule of thumb I use now

Embed when the child is small, bounded, and always read with the parent. Reference when the child grows without limit, is queried on its own, or is shared between parents.

"Bounded" is the word that matters. A document has a 16 MB limit, but the practical limit is far lower: a document that grows forever makes every read of it slower forever.

## What is embedded

**Employee: contact details, addresses, bank account, documents list.** One employee has one current address, one bank account, a handful of documents. Always read together on the profile. Embedded.

```js
const employeeSchema = new Schema({
  code: { type: String, unique: true },
  name: String,
  department: { type: ObjectId, ref: "Department", index: true },
  designation: { type: ObjectId, ref: "Designation" },
  reportsTo: { type: ObjectId, ref: "Employee", index: true },
  contact: { phone: String, email: String, emergency: { name: String, phone: String } },
  address: { line1: String, city: String, state: String, pincode: String },
  bank: { accountNumber: String, ifsc: String, holder: String },
  documents: [{ type: { type: String }, url: String, uploadedAt: Date }],   // bounded: a few per employee
  status: { type: String, enum: ["active", "exited"], index: true },
}, { timestamps: true });
```

**Leave request: its approval history.** A request has at most a handful of transitions. Embedded as an array, append-only, as in the approval-workflow post.

**Salary slip: its line items.** A slip has ten to twenty lines and is immutable once generated. Embedded; the slip is a snapshot, not a view over other collections.

## What is referenced

**Attendance.** One document per employee per day, in its own collection, indexed on `{ employee: 1, day: 1 }`. Three hundred employees for three years is over 300,000 documents; as an array on the employee it would be the unbounded-growth mistake.

**Punches.** Raw device punches, separate again, because there are several per day and they are only read during recalculation.

**Expense claims and leave requests.** Queried by status across all employees for the approver's queue, which an embedded array cannot serve. Referenced, indexed on `{ status: 1, submittedAt: -1 }` and on `{ employee: 1 }`.

**Departments and designations.** Shared between many employees and renamed occasionally. Referenced; a rename is one update.

## The two I changed

**Leave balances were embedded on the employee as `{ casual: 12, sick: 6 }`.** Fine until the year rolled over and carry-forward rules arrived. Balances became a `LeaveBalance` collection keyed by `{ employee, year, type }`, with `allotted`, `used` and `carriedForward`. History became queryable, and the year-end job became an insert rather than a risky in-place rewrite.

**Attendance started as an array of 31 entries on a monthly document per employee.** It seemed tidy. Then the org chart page needed "who is in today across the company", which meant scanning every employee's current month document and filtering arrays in memory. One document per employee per day, with a compound index, made that query an index scan. The migration script ran in an hour; the design decision had cost a few weeks of workarounds.

## Denormalise a little, on purpose

Attendance documents carry `department` copied from the employee at write time. The daily department headcount report is then one `$group` with no join. When an employee changes department, old attendance keeps the old department, which is correct: they were in that department on those days.

Copy fields that are small, that change rarely, and whose historical value is what you want. Do not copy fields that must always be current.

## Indexes come from queries

Every collection's indexes were written by listing its queries first: the approver queue, the monthly calendar, the headcount report. Each query got the index it needed, and nothing else. The explain plans in the MongoDB post are how I check them.

## Sources

- MongoDB data modelling, embedding versus referencing: [mongodb.com/docs/manual/data-modeling/concepts/embedding-vs-references](https://www.mongodb.com/docs/manual/data-modeling/concepts/embedding-vs-references/)
- Unbounded arrays as an anti-pattern: [mongodb.com/docs/manual/data-modeling/design-antipatterns/unbounded-arrays](https://www.mongodb.com/docs/manual/data-modeling/design-antipatterns/unbounded-arrays/)
- The bucket pattern, which the monthly attendance design was a version of: [mongodb.com/docs/manual/data-modeling/design-patterns/group-data/bucket-pattern](https://www.mongodb.com/docs/manual/data-modeling/design-patterns/group-data/bucket-pattern/)
- Mongoose population: [mongoosejs.com/docs/populate.html](https://mongoosejs.com/docs/populate.html)
