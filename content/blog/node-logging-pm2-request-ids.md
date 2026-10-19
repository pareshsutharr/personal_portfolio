---
title: "Logging that helps at 2 am: PM2 logs, request ids, and one grep"
description: "When the Growth Avenues API misbehaves, I want to find every log line for one user's one request in under a minute. That takes a request id, JSON lines, and knowing where PM2 puts things. Here is the setup, and the grep."
date: 2027-05-31T03:30:00Z
tags: [nodejs, logging, pm2, debugging]
keywords: [node logging best practices, pino express request id, pm2 logs rotate, structured logging json node, debug production api logs]
project: growth-avenues
image: /blog/stock/servers-1.webp
imageAlt: "Server racks with cabling in a small computer room"
imageCredit: "Jemimus"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:DHL_Netherlands_local_site_computer_room_server_racks_(2)_-_IMG_3299.jpg"
imageLicense: "CC BY 2.0"
summary: "Attach a request id to every request, log JSON lines that include it, pass it to downstream calls and error reports, and know where PM2 writes its files. Then finding every line for one user's one request is a single grep."
faq:
  - q: "Where are PM2 logs stored?"
    a: "Under ~/.pm2/logs by default, one out and one error file per process, rotated by the pm2-logrotate module."
  - q: "Why log JSON instead of plain text?"
    a: "Fields such as request id, user id and route can be filtered reliably with jq or shipped to a log service without a parsing step."
  - q: "How does the request id reach the client?"
    a: "It is set as an X-Request-Id response header, so a support ticket can quote it and the log search starts from there."
---

A support message says "the client list did not load for Ramesh around 11". Without the right logging, that is an hour of guessing. With it, it is one command. The difference is three decisions made before the problem: one id per request, one line per event in JSON, and log files that do not fill the disk.

## One id per request

Every request gets an id at the edge, and every log line inside that request carries it. Nginx can generate it; the app reads it or makes its own:

```nginx
proxy_set_header X-Request-Id $request_id;
```

```js
import { randomUUID } from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

export const requestContext = new AsyncLocalStorage();

app.use((req, res, next) => {
  const id = req.headers["x-request-id"] ?? randomUUID();
  res.setHeader("X-Request-Id", id);
  requestContext.run({ id, userId: null }, next);
});
```

`AsyncLocalStorage` makes the id available anywhere in the request's call chain without passing it through every function. After authentication, set `userId` in the same store.

## JSON lines with pino

Pino is fast and writes one JSON object per line. The logger reads the request context automatically:

```js
import pino from "pino";

const base = pino({ level: process.env.LOG_LEVEL ?? "info", base: { app: "api" } });

export const log = new Proxy(base, {
  get(target, level) {
    const fn = target[level];
    if (typeof fn !== "function") return fn;
    return (obj, msg) => {
      const ctx = requestContext.getStore() ?? {};
      return typeof obj === "object" ? fn.call(target, { ...ctx, ...obj }, msg) : fn.call(target, ctx, obj);
    };
  },
});
```

Then in a handler:

```js
log.info({ route: "clients.list", count: clients.length, ms: Date.now() - t0 }, "listed clients");
log.warn({ route: "clients.list", err: err.message }, "slow query");
```

Each line looks like:

```json
{"level":30,"time":1770000000000,"app":"api","id":"7f3c...","userId":"64a1...","route":"clients.list","count":38,"ms":11,"msg":"listed clients"}
```

Never log the request body of a login, a token, or a full client record. Log ids and counts; look the record up if you need it.

## Where PM2 puts it

PM2 captures stdout and stderr to `~/.pm2/logs/api-out.log` and `api-error.log`. Two things to set once:

```bash
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 50M
pm2 set pm2-logrotate:retain 14
pm2 set pm2-logrotate:compress true
```

Without rotation, a chatty app fills the disk in a few months, and a full disk takes MongoDB down with it. That is a real 2 am I have had.

## The grep

Back to Ramesh at 11. Find his user id, then:

```bash
grep '"userId":"64a1..."' ~/.pm2/logs/api-out.log | grep '"time":1770' | jq -c 'select(.level >= 30) | {t: (.time/1000|todate), route, ms, msg, err}'
```

Every event in his requests, in order, with timings. If one line says `"ms":4100` on `clients.list`, the MongoDB post has the fix. If there is no line at all, the request never reached the app, and the Nginx access log, which also carries `$request_id`, is next:

```bash
grep '64a1...' /var/log/nginx/access.log
```

Having the same id in both logs is what makes the two greps one investigation.

## Levels, and what each means here

- `error`: something failed that should not have; wake someone.
- `warn`: handled, but worth a look tomorrow; slow queries, rate limits hit, retries.
- `info`: one line per request and per significant action.
- `debug`: everything else, on only when chasing a bug, via `LOG_LEVEL=debug pm2 reload api --update-env`.

## What I do not do

No log shipping to a hosted service for this size of system. The server keeps two weeks, the greps are fast, and the monthly cost is zero. When there are three servers instead of one, shipping to a central store is the next step, and the JSON lines are already in the right shape for it.

## Sources

- pino: [getpino.io](https://getpino.io/)
- `AsyncLocalStorage`: [nodejs.org/api/async_context.html](https://nodejs.org/api/async_context.html)
- Nginx `$request_id`: [nginx.org/en/docs/http/ngx_http_core_module.html#var_request_id](https://nginx.org/en/docs/http/ngx_http_core_module.html#var_request_id)
- pm2-logrotate: [github.com/keymetrics/pm2-logrotate](https://github.com/keymetrics/pm2-logrotate)
- jq: [jqlang.github.io/jq](https://jqlang.github.io/jq/)
