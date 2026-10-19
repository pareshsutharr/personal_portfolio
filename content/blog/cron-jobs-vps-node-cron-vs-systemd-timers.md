---
title: "Scheduled jobs on a VPS: node-cron inside the app, or systemd timers outside it"
description: "Reports at 7 pm, backups at 2 am, a sync every five minutes. I have run them inside the Node process and as system timers, and each is right for a different kind of job. The rule I use to choose, with the setup for both and the double-run bug that cluster mode causes."
date: 2027-10-25T03:30:00Z
tags: [nodejs, linux, cron, systemd, deployment]
keywords: [node-cron vs cron, systemd timer node script, scheduled jobs node.js production, pm2 cluster cron duplicate, run cron job vps]
project: growth-avenues
image: /blog/stock/alarm-1.webp
imageAlt: "Alarm clock on a dark desk"
imageCredit: "Raul Petri raulpetri"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Alarm_Clock_(Unsplash).jpg"
imageLicense: "CC0"
summary: "Run frequent, light jobs that need the app's code inside a dedicated single-instance Node worker with node-cron, and run rare or heavy jobs such as backups as systemd timers outside the app. Guard against overlap, set a time zone, and ping a heartbeat URL on success."
faq:
  - q: "Why did my cron job run twice?"
    a: "PM2 cluster mode runs module-level code, including cron.schedule, in every instance. Move jobs to a separate single-instance process or guard on NODE_APP_INSTANCE."
  - q: "Why prefer a systemd timer over a crontab line?"
    a: "Timers log to the journal, can run a missed job after a reboot with Persistent=true, and survive the app being redeployed."
  - q: "How do I know a scheduled job actually ran?"
    a: "Each job pings a free heartbeat monitor on success; the monitor alerts when a ping is late. Reading logs every morning does not scale."
---

The Growth Avenues platform has about a dozen scheduled jobs. Some live inside the API as `node-cron` schedules; some are separate scripts run by systemd timers. Neither is wrong, but each was wrong for the other's jobs, and finding that out cost a duplicated report and a backup that silently stopped.

## The rule

- **Inside the app** (`node-cron`): jobs that need the app's models, connections and code, run often, and do little work. The five-minute biometric sync; the hourly stale-lead check; cache warming.
- **Outside the app** (systemd timer or crontab): jobs that must run even if the app is down, run rarely, or do heavy work. Backups; the nightly PDF batch; log rotation; anything that would hurt API latency if it ran in the same process.

## Inside: node-cron, in a dedicated process

```js
// src/worker.js, started by PM2 as "worker" with exactly one instance
import cron from "node-cron";
import { connectDb } from "./db.js";
import { syncDevices } from "./jobs/biometric.js";
import { flagStaleLeads } from "./jobs/leads.js";

await connectDb();
cron.schedule("*/5 * * * *", () => run("biometric", syncDevices), { timezone: "Asia/Kolkata" });
cron.schedule("0 * * * *", () => run("stale-leads", flagStaleLeads), { timezone: "Asia/Kolkata" });

const running = new Set();
async function run(name, fn) {
  if (running.has(name)) return log.warn({ job: name }, "skipped: previous run still going");
  running.add(name);
  const t0 = Date.now();
  try { await fn(); log.info({ job: name, ms: Date.now() - t0 }, "job ok"); }
  catch (err) { log.error({ job: name, err }, "job failed"); }
  finally { running.delete(name); }
}
```

Two things that matter. The jobs are in their own process, not the API: a slow sync never delays a request. And `run` guards against overlap: if a sync takes six minutes, the next five-minute tick skips instead of stacking.

## The double-run bug

I first put the schedules in the API itself and ran it in PM2 cluster mode with two instances. Every job ran twice; the stale-lead email went out in pairs. In cluster mode every instance runs your module-level code, including `cron.schedule`. Either keep jobs in a separate single-instance process, as above, or guard with `process.env.NODE_APP_INSTANCE === "0"`, which PM2 sets. The separate process is cleaner.

## Outside: systemd timers

For a backup script or a nightly batch, a timer with a service unit beats a crontab line: it logs to the journal, it can be told not to overlap, and it survives the app being redeployed.

```ini
# /etc/systemd/system/mongo-backup.service
[Unit]
Description=MongoDB backup
[Service]
Type=oneshot
User=backup
EnvironmentFile=/etc/backup.env
ExecStart=/usr/local/bin/mongo-backup.sh
```

```ini
# /etc/systemd/system/mongo-backup.timer
[Unit]
Description=Nightly MongoDB backup
[Timer]
OnCalendar=*-*-* 02:30:00 Asia/Kolkata
Persistent=true
RandomizedDelaySec=300
[Install]
WantedBy=timers.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now mongo-backup.timer
systemctl list-timers | grep mongo
journalctl -u mongo-backup.service --since yesterday
```

`Persistent=true` runs a missed job after a reboot, which a crontab never does; the backup that "silently stopped" had stopped because the server rebooted at 2:29 one night and cron does not catch up. `RandomizedDelaySec` spreads several timers so they do not all start at once.

## Either way: say that it ran

Every job, inside or outside, pings a heartbeat URL on success. A free monitor alerts when a ping is late. This is the only thing that makes a scheduled job observable without reading logs every morning, and it is a single `curl`.

```bash
curl -fsS -m 10 "https://hc-ping.com/<uuid>" > /dev/null
```

## Time zones

Both `node-cron` and systemd timers accept a zone. Always set it. A server in UTC runs "7 pm" at 12:30 am IST, and the report lands in inboxes while the office sleeps.

## Sources

- node-cron: [github.com/node-cron/node-cron](https://github.com/node-cron/node-cron)
- PM2 cluster mode and `NODE_APP_INSTANCE`: [pm2.keymetrics.io/docs/usage/environment](https://pm2.keymetrics.io/docs/usage/environment/)
- systemd timers: [freedesktop.org/software/systemd/man/latest/systemd.timer.html](https://www.freedesktop.org/software/systemd/man/latest/systemd.timer.html)
- `OnCalendar` syntax: [freedesktop.org/software/systemd/man/latest/systemd.time.html](https://www.freedesktop.org/software/systemd/man/latest/systemd.time.html)
- Healthchecks.io: [healthchecks.io](https://healthchecks.io/)
