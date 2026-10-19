---
title: "The disaster recovery drill: rebuilding the whole platform on a fresh VPS from backups, timed"
description: "Backups that have never been restored are a hope. Once a quarter, I rent a new VPS for a day and rebuild the Growth Avenues platform on it from nothing but the repository and the previous night's backups, with a stopwatch. The first drill took six hours and found three gaps. The last took 74 minutes. The checklist, what each drill found, and the document that came out of it."
date: 2028-09-11T03:30:00Z
tags: [operations, backups, deployment, linux, reliability]
keywords: [disaster recovery drill small business, restore vps from backup test, rebuild server from scratch checklist, mongodb restore drill, recovery time objective small project]
project: growth-avenues
image: /blog/stock/backup-3.webp
imageAlt: "Hard disk drive internals"
imageCredit: "Shams948"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Hard_drive_08.jpg"
imageLicense: "CC0"
---

The backups post set up nightly dumps to object storage. This post is about the question that post did not answer: if the VPS disappeared tonight, how long until the platform is back, and does anyone actually know the steps? The only way to know is to do it. So every quarter, it gets done.

## The drill

1. Rent a fresh VPS at the same provider, same size. Start the stopwatch.
2. Using only the runbook, the repository and the backup bucket, bring the platform up on it.
3. Point a test subdomain at it. Log in. Run the five Playwright flows against it.
4. Stop the stopwatch. Destroy the VPS. Write down what went wrong.

The real DNS is never changed; this is a rehearsal. The cost is one day of a VPS, a few rupees.

## What the first drill found

**Six hours.** Three gaps, each a surprise:

- **The backup encryption key was only on the old server.** The dumps were encrypted, which was good, and the key was in `/etc/backup.env` on the machine that, in the scenario, no longer existed. The key now also lives in the client's password manager and mine, and the runbook's first step is "retrieve the key".
- **Nginx config and certificates were not in the repository.** They had been edited in place for two years. Now `infra/nginx/` in the repository is the source and a deploy step copies it; certificates are re-issued by Certbot, which takes a minute once DNS points at the box.
- **The biometric device integration needed a static IP allow-listed at the vendor.** A new server has a new IP. That is a phone call to the vendor with a one-day turnaround, which is now documented as the known floor on full recovery, and the reason the provider's reserved IP feature is now used.

## What the later drills found

- Second drill, three hours: the Node version in `.nvmrc` had drifted from what production actually ran. Fixed by making the deploy script fail if they differ.
- Third, two hours: the Meilisearch index had no backup and needed a full re-index from MongoDB, forty minutes. The re-index script is now part of the restore steps and runs in the background while the rest proceeds.
- Fourth, 74 minutes: nothing new. The time was the restore itself, the re-index, and waiting for DNS.

## The restore steps, as they stand

```
0.  Retrieve backup key and S3 credentials from password manager        (5 min)
1.  Provision VPS, attach reserved IP, add deploy SSH key               (5 min)
2.  bash <(curl -fsSL repo/infra/bootstrap.sh)   # users, Node, pnpm, MongoDB, Redis, Nginx, PM2, Certbot, ufw   (12 min)
3.  Clone repo as deploy user; copy infra/nginx; certbot --nginx        (6 min)
4.  Fetch latest dump from bucket; decrypt; mongorestore --drop         (15 min for 6 GB)
5.  Create .env from password manager entries (list in .env.example)   (5 min)
6.  pnpm install && pnpm build && pm2 start ecosystem.config.cjs       (8 min)
7.  Start Meilisearch re-index in background                           (0 min, 40 to finish)
8.  Health check, login, run E2E suite against new host                (10 min)
9.  Switch DNS; confirm; notify client                                 (DNS propagation varies)
```

Seventy-four minutes to step 8 on the last run. The bootstrap script is the part that turned "a day of remembering apt commands" into twelve minutes, and it is tested by the drill every quarter, which is the only reason it still works.

## Recovery objectives, written down

After the first drill the client and I agreed two numbers and put them in the maintenance agreement:

- **Recovery point objective: 24 hours.** The nightly backup. If that is too much loss for a future module, hourly dumps of the hot collections are the next step.
- **Recovery time objective: 4 hours.** From the decision to rebuild to the platform being back on the real domain. The drills show about 90 minutes of work plus DNS, so there is slack for things going wrong.

Those two numbers are what "we have backups" means in practice, and before the drill nobody could have stated them.

## Who can do it

The drill is run by me, and once a year by the client's IT person following the runbook with me watching and not helping. That second version is the real test. The first time, they got stuck at step 4 because the decryption command in the runbook assumed a tool they did not have installed. The runbook now installs it.

## Sources

- Google SRE on disaster recovery testing: [sre.google/sre-book/accelerating-sre-on-call](https://sre.google/sre-book/accelerating-sre-on-call/)
- RPO and RTO, defined: [en.wikipedia.org/wiki/Disaster_recovery#Recovery_objectives](https://en.wikipedia.org/wiki/Disaster_recovery#Recovery_objectives)
- `mongorestore`: [mongodb.com/docs/database-tools/mongorestore](https://www.mongodb.com/docs/database-tools/mongorestore/)
- Meilisearch snapshots, an alternative to re-indexing: [meilisearch.com/docs/learn/data_backup/snapshots](https://www.meilisearch.com/docs/learn/data_backup/snapshots)
