---
title: "Multi-tenant or not: how I decided for an HRMS, and what it cost"
description: "When a second company wanted the Growth Avenues HRMS, I had to choose between one codebase with a tenant id on every row and one deployment per customer. I chose per-customer deployments. The reasoning, the trade-offs a year later, and the point at which I would switch."
date: 2027-08-16T03:30:00Z
tags: [architecture, saas, hrms, mongodb, deployment]
keywords: [multi tenant saas architecture, single tenant vs multi tenant, tenant id every row mongodb, saas architecture small team, hrms saas design]
project: growth-avenues-hrms
---

The HRMS was built for one company. When a related business asked to use it, the question was not whether to say yes but how. Multi-tenancy, one running system serving many customers with a tenant id on every record, is the default answer in every SaaS article. For a one-developer team with two customers, I chose the other answer, and I would again.

## The two options, honestly

**Multi-tenant**: one database, one deployment, `tenantId` on every document, every query filtered by it, and every mistake a potential leak between customers. Cheaper to run at scale. Expensive to get right once.

**Single-tenant per customer**: one deployment, one database and one subdomain per customer, from the same codebase. Isolation by construction. More servers to patch; no code paths that can mix customers' data.

## Why single-tenant won

1. **Data isolation is free.** HR data, salaries, documents. A bug that showed one company's payroll to another would end the product. With separate databases, there is no query that could do it.
2. **Customisation without flags.** The second company wanted a different leave policy and a different salary slip layout. Those are per-deployment configuration, not feature flags threaded through shared code.
3. **Two customers.** Multi-tenancy's advantages are per-customer cost and operational simplicity at tens or hundreds of tenants. At two, the cost is one more small VPS and the operations are a script.
4. **One person.** Every `tenantId` filter is a place I could forget one. I did not want to be the only reviewer of that code.

## What it looks like

```
hr.growthavenues.in   → VPS A: api + web, MongoDB database "ga_hr"
hr.secondco.in        → VPS A: api + web (second PM2 app), MongoDB database "secondco_hr"
```

Same server for now, separate processes and databases, separate `.env` files. The deploy script takes a customer name and reads its config. A third customer is a directory and a DNS record.

```bash
./deploy.sh ga        # deploys /var/apps/hr-ga from main
./deploy.sh secondco  # deploys /var/apps/hr-secondco from main
```

Shared code, deployed twice. Fixes reach both on the next deploy.

## What it cost a year later

- **Migrations run per customer.** The migration script loops over customers; a failure in one does not touch the other, which is a feature, but I have to watch two logs.
- **Monitoring doubled.** Two health checks, two backup jobs, two sets of logs. All scripted, but each a thing.
- **No cross-customer reporting.** There is none to do; each company owns its data. If there were, it would be a deliberate export, which is arguably correct for HR data anyway.
- **Cost**: the second deployment added roughly one small VPS worth of resources. Cheaper than the week of work a correct tenant layer would have taken.

## When I would switch

At somewhere between ten and twenty customers, the operations stop being a script and start being a job. At that point, the move is to multi-tenancy at the database layer first, one database per tenant on a shared cluster with a connection chosen per request by subdomain, which keeps isolation while collapsing the deployments. The application code stays almost unchanged, because it never learned about tenants; it only ever knew about its own database.

That migration path is the real reason single-tenant was the safe first choice. It does not close the door; it keeps the door simple.

## Sources

- Multi-tenant data architecture patterns, Microsoft's overview: [learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models](https://learn.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations/tenancy-models)
- MongoDB on multi-tenancy approaches: [mongodb.com/docs/atlas/build-multi-tenant-arch](https://www.mongodb.com/docs/atlas/build-multi-tenant-arch/)
- Mongoose `useDb` for a database per tenant on one connection: [mongoosejs.com/docs/api/connection.html#Connection.prototype.useDb()](https://mongoosejs.com/docs/api/connection.html#Connection.prototype.useDb())
