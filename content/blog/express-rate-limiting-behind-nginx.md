---
title: "Rate limiting an Express API behind Nginx: trust proxy, buckets and honest 429s"
description: "A rate limiter that counts every request as coming from 127.0.0.1 limits nobody and then blocks everybody. What I set on the Growth Avenues API: per-IP limits in Nginx, per-user limits in Express, and 429 responses the frontend can act on."
date: 2027-02-01T03:30:00Z
tags: [express, nginx, security, nodejs]
keywords: [express rate limit, express-rate-limit trust proxy, nginx limit_req, rate limiting behind reverse proxy, 429 retry-after header]
project: growth-avenues
image: /blog/stock/security-3.webp
imageAlt: "Old iron latch on weathered wooden boards"
imageCredit: "Estormiz"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Padlock_Valimokatu_Oulu_20250307_01.jpg"
imageLicense: "CC0"
---

The first rate limiter I added to the Growth Avenues API did nothing for a week and then blocked the whole office in one minute. Both failures had the same cause: behind Nginx, Express sees every request from `127.0.0.1`. Until you fix that, per-IP limiting is per-everyone limiting.

## Step 0: tell Express about the proxy

```js
app.set("trust proxy", 1);
```

The number means "trust exactly one proxy hop". Express then reads the client address from `X-Forwarded-For`, which Nginx sets. Do not use `true`; that trusts any header, and a client could spoof its own IP to dodge the limit.

Nginx needs to send the header, which the standard block does:

```nginx
proxy_set_header X-Real-IP       $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## Two layers, two jobs

**Nginx limits per IP.** It is cheap, it runs before the app, and it is the right place to stop a flood.

```nginx
limit_req_zone $binary_remote_addr zone=api:10m rate=20r/s;

server {
    location / {
        limit_req zone=api burst=40 nodelay;
        limit_req_status 429;
        proxy_pass http://127.0.0.1:4000;
    }
}
```

Twenty requests per second per IP, with a burst of forty so a page that fires ten calls on load is not punished. An office behind one public IP shares that budget, which is why the number is generous.

**Express limits per user and per route.** The login endpoint, password reset and anything that costs money get tight limits keyed by the account, not the IP:

```js
import rateLimit from "express-rate-limit";

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  keyGenerator: (req) => `${req.ip}:${String(req.body.email ?? "").toLowerCase()}`,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: "Too many attempts. Try again in a few minutes." },
});
app.post("/auth/login", loginLimiter, login);

const userLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  keyGenerator: (req) => req.user?.id ?? req.ip,
  standardHeaders: "draft-7",
});
app.use("/api", requireAuth, userLimiter);
```

Keying login by IP and email together means one attacker cannot lock out a user by hammering their email from many IPs, and one user cannot be blocked because a colleague on the same office IP forgot a password.

## Make 429 useful

`standardHeaders: "draft-7"` adds `RateLimit-Limit`, `RateLimit-Remaining` and `RateLimit-Reset`. Nginx's 429 does not, so add a `Retry-After`:

```nginx
error_page 429 = @ratelimited;
location @ratelimited {
    add_header Retry-After 2 always;
    return 429 '{"error":"Too many requests"}';
}
```

The frontend treats 429 like this: read `Retry-After` or `RateLimit-Reset`, wait that long, retry once, then show the message. A spinner that retries in a loop makes a rate limit worse.

## Where state lives

`express-rate-limit` keeps counters in memory by default, per process. With PM2 in cluster mode you have two processes and two sets of counters, so limits are effectively doubled. For a single VPS that is tolerable. If you need exact limits across processes or servers, point it at Redis with the `rate-limit-redis` store; the change is one option.

## Testing it

```bash
for i in $(seq 1 60); do curl -s -o /dev/null -w "%{http_code}\n" https://api.example.com/health; done | sort | uniq -c
```

You should see a mix of 200 and 429. If it is all 200, Nginx is not limiting. If the first request is 429, something upstream is sharing one IP, which is exactly the trust-proxy bug this post opened with.

## Sources

- Express behind proxies and `trust proxy`: [expressjs.com/en/guide/behind-proxies.html](https://expressjs.com/en/guide/behind-proxies.html)
- Nginx `limit_req`: [nginx.org/en/docs/http/ngx_http_limit_req_module.html](https://nginx.org/en/docs/http/ngx_http_limit_req_module.html)
- express-rate-limit: [express-rate-limit.mintlify.app](https://express-rate-limit.mintlify.app/)
- IETF RateLimit header fields draft: [datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)
