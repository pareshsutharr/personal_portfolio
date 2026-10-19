---
title: "Zero-downtime deploys on one VPS with PM2 reload and a health check"
description: "Users on a broking platform notice a dropped request. The four-line deploy I use keeps the old process serving until the new one says it is ready, with a health endpoint, a graceful shutdown, and a rollback that takes ten seconds."
date: 2027-01-11T03:30:00Z
tags: [pm2, nodejs, deployment, linux]
keywords: [pm2 reload zero downtime, pm2 cluster mode graceful shutdown, node health check endpoint, deploy without downtime single server, pm2 wait_ready]
project: growth-avenues
image: /blog/stock/servers-3.webp
imageAlt: "Close-up of blade servers in a rack"
imageCredit: "NOIRLab/NSF/AURA/T. Slovinský"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:NOIRLab_HQ_Server_Racks_(6V6A0404-CC).jpg"
imageLicense: "CC BY 4.0"
---

`pm2 restart` kills the process and starts a new one. For a second or two, requests fail. On a site where people are placing orders, that second is a support ticket. `pm2 reload` in cluster mode fixes it, but only if your app cooperates in two small ways: it tells PM2 when it is actually ready, and it finishes in-flight requests when told to stop.

## 1. Run in cluster mode

Cluster mode runs more than one copy of your app. Reload then replaces them one at a time, so there is always at least one serving.

```js
// ecosystem.config.js
module.exports = {
  apps: [{
    name: "api",
    script: "src/server.js",
    instances: 2,
    exec_mode: "cluster",
    wait_ready: true,
    listen_timeout: 10000,
    kill_timeout: 8000,
  }],
};
```

Two instances on a one-vCPU box is fine; they are not for throughput, they are for the handover.

## 2. Say "ready" only when you are

With `wait_ready: true`, PM2 does not consider the new instance up until it sends a message. Send it after the database is connected and the server is listening, not before:

```js
import http from "node:http";
import mongoose from "mongoose";
import { app } from "./app.js";

await mongoose.connect(process.env.MONGODB_URI);
const server = http.createServer(app).listen(process.env.PORT, "127.0.0.1", () => {
  if (process.send) process.send("ready");
});
```

Without this, PM2 would route traffic to a process that is still connecting to Mongo, and you would trade a dropped request for a 500.

## 3. Shut down gracefully

When PM2 reloads, it sends `SIGINT` to the old instance and waits `kill_timeout` ms before forcing it. Use that time to stop accepting new connections and let current ones finish:

```js
process.on("SIGINT", async () => {
  server.close(async () => {          // stop accepting, finish in-flight
    await mongoose.disconnect();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 7000).unref(); // give up before PM2 does
});
```

Long-running work, like a report that takes 30 seconds, needs its own handling. I queue those in a separate worker process that reloads on its own schedule.

## 4. A health endpoint that means something

```js
app.get("/health", async (req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.status(dbOk ? 200 : 503).json({ ok: dbOk, uptime: process.uptime() });
});
```

Nginx does not use this, but the deploy script and the uptime monitor do. A health check that always returns 200 is decoration.

## The deploy script

```bash
#!/usr/bin/env bash
set -euo pipefail
cd /var/apps/api
git fetch --quiet && git checkout --quiet "${1:-origin/main}"
npm ci --omit=dev --silent
pm2 reload ecosystem.config.js --update-env
sleep 3
curl -fsS http://127.0.0.1:4000/health >/dev/null && echo "deploy ok: $(git rev-parse --short HEAD)"
```

`set -e` stops the script at the first failure, so a broken `npm ci` never reaches the reload. The health check at the end is what tells me the deploy actually worked, not just that PM2 accepted it.

## Rollback

Because the script takes a ref, rollback is the same script with the previous commit:

```bash
./deploy.sh 3f2a9c1
```

I keep the last three deployed SHAs in a text file the script appends to. Ten seconds from "this is broken" to "the old version is back", and nobody noticed either change.

## What this does not solve

- Schema changes that the old process cannot handle. Deploy the migration in a backward-compatible way first, then the code. The MongoDB post on index builds covers the usual case.
- Static front-end builds. Those are a directory swap: build into `/var/www/portal-next`, then `mv` it over the old one. The move is atomic; Nginx never serves a half-copied build.

## Sources

- PM2 graceful start and shutdown: [pm2.keymetrics.io/docs/usage/signals-clean-restart](https://pm2.keymetrics.io/docs/usage/signals-clean-restart/)
- PM2 cluster mode: [pm2.keymetrics.io/docs/usage/cluster-mode](https://pm2.keymetrics.io/docs/usage/cluster-mode/)
- Node `server.close`: [nodejs.org/api/net.html#serverclosecallback](https://nodejs.org/api/net.html#serverclosecallback)
- Mongoose connection states: [mongoosejs.com/docs/connections.html](https://mongoosejs.com/docs/connections.html)
