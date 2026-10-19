---
title: "Monitoring a VPS for free: uptime checks, disk alerts, and PM2 restarts you hear about"
description: "A server that is down and nobody knows is worse than a server that is down. The free monitoring on every VPS I run: external uptime checks, a disk and memory script that emails before it is too late, and a PM2 hook that reports crashes."
date: 2027-09-27T03:30:00Z
tags: [linux, monitoring, pm2, deployment]
keywords: [vps monitoring free, uptime monitoring free, disk space alert script linux, pm2 crash notification, server monitoring small project]
project: growth-avenues
image: /blog/stock/servers-2.webp
imageAlt: "Rows of server racks lit blue in a data centre"
imageCredit: "NOIRLab/NSF/AURA/P. Horálek"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:NOIRLab_HQ_Server_Racks_(OK_upr_IMG_0225-CC).jpg"
imageLicense: "CC BY 4.0"
summary: "External uptime checks from a free monitor, a small script that emails before disk or memory run out, and a PM2 event hook that reports crashes and restarts. None of it costs money and it means an outage is known before a client calls."
faq:
  - q: "How do I get alerted when my VPS goes down?"
    a: "An external uptime service pings a health endpoint every minute and emails or messages when it fails. It must be external; a monitor on the same server dies with it."
  - q: "What causes most surprise outages on a small server?"
    a: "A full disk from logs or backups. A cron script that checks free space and emails at 80 percent prevents nearly all of them."
  - q: "How do I know PM2 restarted my app?"
    a: "A small process subscribed to PM2's event bus sends a message on restart and exit events, with the process name and the reason."
---

For two years the monitoring on the Growth Avenues servers has cost nothing and has caught every outage before a user reported it. It is three pieces, none of them a monitoring product: an external uptime check, a cron script on the box, and a PM2 event hook. Here they are.

## 1. Something outside the server checks the server

If the server is down, nothing on it can tell you. Use a free external checker: UptimeRobot, Better Stack's free tier, or Healthchecks.io for heartbeat-style checks. It requests `/health` every minute from outside and emails or messages you after two failures.

The `/health` endpoint must check the database, not just return 200, or you will be "up" with every request failing:

```js
app.get("/health", async (req, res) => {
  const db = mongoose.connection.readyState === 1;
  res.status(db ? 200 : 503).json({ ok: db });
});
```

Point the check at the API and at the public site separately. They fail for different reasons.

## 2. A script that watches the things that fill up

Disk and memory do not fail suddenly; they fill. A script every fifteen minutes that emails when a threshold is crossed gives you days of warning. It uses the same Gmail SMTP the site uses, through `msmtp`, or `curl` to a webhook.

```bash
#!/usr/bin/env bash
# /usr/local/bin/watch.sh
set -u
HOST=$(hostname)
ALERT=""

DISK=$(df / --output=pcent | tail -1 | tr -dc '0-9')
[ "$DISK" -ge 80 ] && ALERT+="Disk / at ${DISK}%\n"

MEM=$(free | awk '/Mem:/ { printf("%d", $3/$2*100) }')
[ "$MEM" -ge 90 ] && ALERT+="Memory at ${MEM}%\n"

LOAD=$(cut -d' ' -f1 /proc/loadavg | cut -d. -f1)
CORES=$(nproc)
[ "$LOAD" -ge $((CORES * 2)) ] && ALERT+="Load ${LOAD} on ${CORES} cores\n"

if ! pm2 jlist | jq -e '.[] | select(.name=="api") | select(.pm2_env.status=="online")' >/dev/null; then
  ALERT+="PM2 app 'api' is not online\n"
fi

if [ -n "$ALERT" ]; then
  STAMP=/tmp/watch-last-alert
  if [ ! -f "$STAMP" ] || [ $(( $(date +%s) - $(stat -c %Y "$STAMP") )) -gt 3600 ]; then
    printf "Subject: [%s] server alert\n\n%b" "$HOST" "$ALERT" | msmtp "$ALERT_EMAIL"
    touch "$STAMP"
  fi
fi
```

```
*/15 * * * * ALERT_EMAIL=you@example.com /usr/local/bin/watch.sh
```

The `STAMP` file rate-limits alerts to one an hour, so a full disk sends one email, not ninety-six. The disk threshold at 80 percent is early on purpose; MongoDB stops writing well before 100.

## 3. PM2 tells you when it restarts something

PM2 restarts a crashed app silently, which is good for uptime and bad for knowing. A small PM2 module script listens for restart events:

```js
// /var/apps/ops/pm2-events.js, run with: pm2 start pm2-events.js --name events
import pm2 from "pm2";
import { execFile } from "node:child_process";

pm2.connect(() => {
  pm2.launchBus((err, bus) => {
    bus.on("process:event", (data) => {
      if (!["restart", "exit", "stop"].includes(data.event)) return;
      if (data.process.name === "events") return;
      const msg = `Subject: [pm2] ${data.process.name} ${data.event}\n\nrestarts: ${data.process.restart_time}\n`;
      execFile("sh", ["-c", `printf '${msg.replace(/'/g, "'\\''")}' | msmtp ${process.env.ALERT_EMAIL}`]);
    });
  });
});
```

Five restarts in an hour on a quiet day is how I learned about a memory leak in a PDF route two days before it would have become an outage.

## What to look at when an alert arrives

1. `pm2 status` and `pm2 logs api --lines 100 --err`.
2. `df -h` and `du -sh /var/log /home/*/.pm2/logs` for disk; the logs are usually the culprit.
3. `free -h` and `pm2 monit` for memory.
4. `sudo tail -50 /var/log/nginx/error.log` for anything upstream.

Ninety percent of alerts end at step one or two.

## When to pay for monitoring

When there is more than one server, or when someone other than you needs to be woken. A hosted service gives you on-call schedules, dashboards and history. Until then, the three pieces above are more than enough, and they taught me what I would actually want from a paid tool.

## Sources

- Healthchecks.io: [healthchecks.io](https://healthchecks.io/)
- UptimeRobot: [uptimerobot.com](https://uptimerobot.com/)
- msmtp, a small SMTP client for scripts: [marlam.de/msmtp](https://marlam.de/msmtp/)
- PM2 programmatic API and bus events: [pm2.keymetrics.io/docs/usage/pm2-api](https://pm2.keymetrics.io/docs/usage/pm2-api/)
- `df` and `free` from GNU coreutils and procps: [gnu.org/software/coreutils](https://www.gnu.org/software/coreutils/)
