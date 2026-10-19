---
title: "Nginx caching in front of a Node app: static assets forever, API responses for seconds, HTML never"
description: "Three cache rules in Nginx took a client's VPS from 60% CPU at peak to 15%. Hashed assets cached for a year, a handful of public API endpoints micro-cached for ten seconds, and HTML left alone. The config, how to confirm it is working, and the header that caused a day of confusion."
date: 2028-03-06T03:30:00Z
tags: [nginx, caching, performance, deployment, linux]
keywords: [nginx proxy cache node.js, nginx cache static assets expires, nginx microcaching api, nginx cache-control immutable, nginx proxy_cache_valid]
project: growth-avenues
---

Node is fine at serving files and fine at answering the same request twice. Nginx is better at both, and it is already in front of the app. Three cache rules, each with a different lifetime, took most of the repeated work off the Node processes.

## 1. Hashed static assets: a year, immutable

Next.js, Vite and most bundlers put a content hash in asset filenames. A changed file gets a new name, so the old name can be cached forever:

```nginx
location ~* ^/(_next/static|assets)/ {
  proxy_pass http://127.0.0.1:3000;
  proxy_cache static;
  proxy_cache_valid 200 365d;
  proxy_ignore_headers Cache-Control Expires;
  add_header Cache-Control "public, max-age=31536000, immutable";
  add_header X-Cache $upstream_cache_status;
}
```

Nginx stores the file after the first request and never asks Node again. The browser is told the same thing with `immutable`, so it does not even revalidate. Both the server-side cache and the browser cache are safe precisely because the name changes when the content does.

The cache zone is declared once at the top level:

```nginx
proxy_cache_path /var/cache/nginx/static levels=1:2 keys_zone=static:10m max_size=1g inactive=30d use_temp_path=off;
proxy_cache_path /var/cache/nginx/api    levels=1:2 keys_zone=api:10m    max_size=100m inactive=1m use_temp_path=off;
```

## 2. Public API responses: ten seconds

The public site calls a few endpoints that are the same for everyone: the list of schemes, the NAV table, the published FAQ. They change rarely, are requested constantly, and ten seconds of staleness is invisible:

```nginx
location ~ ^/api/public/ {
  proxy_pass http://127.0.0.1:4000;
  proxy_cache api;
  proxy_cache_valid 200 10s;
  proxy_cache_key "$scheme$host$request_uri";
  proxy_cache_lock on;
  proxy_cache_use_stale updating error timeout;
  proxy_cache_methods GET HEAD;
  add_header X-Cache $upstream_cache_status;
}
```

`proxy_cache_lock` lets one request fill the cache while the others wait for it, instead of all of them hitting Node when the entry expires. `proxy_cache_use_stale updating` serves the old response while the new one is fetched, so nobody waits at all. `error timeout` serves the stale copy if Node is down, which turns a brief restart into nothing visible.

Only `/api/public/` is matched. Everything under `/api/` that depends on who is asking is never cached by Nginx. One misplaced rule here serves one user's data to another, so the path prefix is explicit and the authenticated routes live elsewhere.

## 3. HTML: not cached

HTML is where the session, the CSRF token and the personalised bits live. Node, or Next.js, decides its caching, and Nginx just passes it through. The default `location /` block has no `proxy_cache`.

Next.js adds its own `Cache-Control` headers for static and ISR pages, and the browser respects them. Nginx caching on top would double the staleness and make `revalidatePath` appear not to work.

## Confirm it

```bash
curl -sI https://app.example.in/_next/static/chunks/main-abc123.js | grep -i -E 'x-cache|cache-control'
# X-Cache: HIT
# Cache-Control: public, max-age=31536000, immutable

curl -sI https://app.example.in/api/public/schemes | grep -i x-cache   # MISS, then HIT, then after 10 s: MISS or UPDATING
```

The `X-Cache` header costs nothing and answers "is it actually caching" without reading logs. Leave it on.

## The header that cost a day

Node was sending `Cache-Control: private` on static assets because a middleware applied it globally. Nginx honours upstream cache headers by default, so it refused to cache them, and `X-Cache` said `MISS` forever. `proxy_ignore_headers Cache-Control Expires` in the static block tells Nginx to use its own rule, and the global middleware was narrowed to API routes where `private` belongs. Check the upstream's headers first when a cache rule seems to do nothing.

## Purging

Hashed assets never need purging. The API cache expires in ten seconds. When something truly must go now, `rm -rf /var/cache/nginx/api/*` followed by `nginx -s reload` is crude and fine at this scale. The paid Nginx has a purge API; for a small VPS, a ten-second TTL is the purge strategy.

## Sources

- Nginx `proxy_cache` directives: [nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache)
- `proxy_cache_use_stale`: [nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_use_stale](https://nginx.org/en/docs/http/ngx_http_proxy_module.html#proxy_cache_use_stale)
- `Cache-Control: immutable`: [developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#immutable](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control#immutable)
- Nginx microcaching guide: [blog.nginx.org/blog/benefits-of-microcaching-nginx](https://blog.nginx.org/blog/benefits-of-microcaching-nginx)
- Next.js caching: [nextjs.org/docs/app/guides/caching](https://nextjs.org/docs/app/guides/caching)
