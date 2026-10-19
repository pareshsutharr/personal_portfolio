---
title: "MongoDB backups on a VPS: mongodump, cron, off-site copies, and restoring once a month"
description: "A backup you have never restored is a guess. The nightly dump, the off-site copy, and the monthly restore drill I run for the databases behind Growth Avenues, with the exact commands and the one that deletes old backups safely."
date: 2027-05-24T03:30:00Z
tags: [mongodb, linux, backups, deployment]
keywords: [mongodb backup cron vps, mongodump restore, mongodb backup to s3, automated mongodb backup script, test database restore]
project: growth-avenues
image: /blog/stock/backup-1.webp
imageAlt: "Open hard disk drive showing the platters"
imageCredit: "Shams948"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Hard_drive_06.jpg"
imageLicense: "CC0"
summary: "A nightly mongodump compressed and encrypted, copied off-site to object storage, pruned by age with a script that cannot delete today's file, and a monthly restore into staging to prove it works. The commands, the cron line and the restore drill."
faq:
  - q: "How often should I back up MongoDB on a VPS?"
    a: "Nightly for most small products, with the dump copied off the server. If a day of loss is too much for a collection, add hourly dumps of that collection."
  - q: "How do I know a backup is restorable?"
    a: "Restore it. A monthly restore into staging with a row-count check is the only proof; the restore drill post goes further and rebuilds a whole server."
  - q: "How do I delete old backups safely?"
    a: "Prune by age with a script that lists what it will remove and refuses to run if the newest file is older than a day."
---

The database behind a broking platform holds client records, orders and the audit trail a regulator may ask for. Losing it is not an option, and "the host takes snapshots" is not a backup plan; it is a hope. Here is the plan that is actually in place, small enough to understand in full.

## Three copies, two places, one tested

- A nightly dump on the server itself, kept for seven days.
- The same dump copied to object storage in another provider, kept for 90 days.
- A restore of the latest dump into a scratch database once a month, with a checklist.

## The dump

`mongodump` writes a compressed archive of the whole database. With authentication and a dedicated backup user that can only read:

```js
// run once in mongosh
use admin
db.createUser({ user: "backup", pwd: "...", roles: [{ role: "backup", db: "admin" }] })
```

```bash
#!/usr/bin/env bash
# /usr/local/bin/mongo-backup.sh
set -euo pipefail
DIR=/var/backups/mongo
STAMP=$(date +%F-%H%M)
mkdir -p "$DIR"
mongodump --uri "$MONGO_BACKUP_URI" --gzip --archive="$DIR/db-$STAMP.gz"
find "$DIR" -name 'db-*.gz' -mtime +7 -delete
rclone copy "$DIR/db-$STAMP.gz" remote:growthavenues-backups/mongo/
echo "backup ok $STAMP $(du -h "$DIR/db-$STAMP.gz" | cut -f1)"
```

`set -euo pipefail` stops the script at the first failed command, so a dump that fails never gets its predecessor deleted by the `find`. The `find` deletes only files older than seven days matching the backup pattern, nothing else in the directory.

## The off-site copy

`rclone` talks to S3, Backblaze B2, Google Drive and most other storage. Configure it once as the backup user, then the one line above copies the archive. Set a lifecycle rule in the bucket to delete objects after 90 days; the server never needs delete permission on the remote, which means a compromised server cannot destroy the off-site copies.

## Cron

```bash
sudo crontab -u backup -e
```

```
MONGO_BACKUP_URI=mongodb://backup:...@127.0.0.1:27017/?authSource=admin
30 2 * * * /usr/local/bin/mongo-backup.sh >> /var/log/mongo-backup.log 2>&1
```

2:30 am IST is after the day's batch jobs and before anyone is working. Check the log the next morning once, then set up the alert below and stop checking by hand.

## Knowing it ran

A backup that silently stops is the common failure. A free uptime monitor with a heartbeat URL solves it: the script `curl`s the URL on success, and the monitor emails you if no ping arrives within 26 hours.

```bash
curl -fsS -m 10 --retry 3 "https://hc-ping.com/your-uuid" > /dev/null
```

## The monthly restore

The restore drill is a calendar reminder on the first Monday of the month. It takes fifteen minutes.

```bash
mongorestore --uri "$MONGO_ADMIN_URI" --gzip --archive=/var/backups/mongo/db-2027-05-01-0230.gz \
  --nsFrom 'growthavenues.*' --nsTo 'restore_test.*' --drop
```

Then, in `mongosh`, four checks: the collections exist, `countDocuments()` on clients is close to production's, one known client record is intact, and the newest order is from the day before the dump. Then drop `restore_test`. Write the date and the counts in a notes file.

The first drill found that the dump user lacked permission on one collection added that month. That is the entire argument for the drill.

## Point-in-time

Nightly dumps lose up to a day. If that is not acceptable, run a replica set and back up from a secondary, or use a hosted MongoDB with continuous backup. For Growth Avenues the orders of record live with the exchange and the clearing systems; a day of the platform's own data is recoverable. Know which of those you are before choosing.

## Sources

- `mongodump`: [mongodb.com/docs/database-tools/mongodump](https://www.mongodb.com/docs/database-tools/mongodump/)
- `mongorestore` with namespace remapping: [mongodb.com/docs/database-tools/mongorestore](https://www.mongodb.com/docs/database-tools/mongorestore/)
- Built-in `backup` role: [mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-backup](https://www.mongodb.com/docs/manual/reference/built-in-roles/#mongodb-authrole-backup)
- rclone: [rclone.org](https://rclone.org/)
- Healthchecks.io cron monitoring: [healthchecks.io](https://healthchecks.io/)
