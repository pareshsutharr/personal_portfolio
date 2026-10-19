---
title: "One Nginx, four apps: public site, client portal, back office and API on separate hosts"
description: "How the Growth Avenues platform runs several applications behind one Nginx, each on its own subdomain and its own PM2 process, with shared TLS and nothing talking to the outside except Nginx."
date: 2027-01-04T03:30:00Z
tags: [nginx, pm2, linux, deployment, architecture]
keywords: [nginx multiple apps same server, nginx subdomain reverse proxy, host multiple node apps one vps, nginx server blocks subdomains, pm2 multiple apps]
project: growth-avenues
image: /blog/stock/servers-2.webp
imageAlt: "Rows of server racks lit blue in a data centre"
imageCredit: "NOIRLab/NSF/AURA/P. Horálek"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:NOIRLab_HQ_Server_Racks_(OK_upr_IMG_0225-CC).jpg"
imageLicense: "CC BY 4.0"
---

Growth Avenues is not one app. There is the public website, the client portal people log into, the back office the operations team uses, and the API all three talk to. Early on they were spread across servers that each needed patching. Today the pattern is one Nginx per server, one server block per hostname, one PM2 process per app, and every app bound to localhost.

## The layout

```
www.growthavenues.in      → Next.js, port 3000
portal.growthavenues.in   → React build, static files
admin.growthavenues.in    → React build, static files, IP-restricted
api.growthavenues.in      → Node.js/Express, port 4000
```

Static builds are served by Nginx directly; only the Next.js site and the API are Node processes. Two processes to keep alive instead of four.

## One server block per hostname

Each goes in `/etc/nginx/sites-available/<host>` and gets symlinked into `sites-enabled`. The API block:

```nginx
server {
    listen 443 ssl http2;
    server_name api.growthavenues.in;

    ssl_certificate     /etc/letsencrypt/live/api.growthavenues.in/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.growthavenues.in/privkey.pem;

    client_max_body_size 20m;

    location / {
        proxy_pass         http://127.0.0.1:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
    }
}
```

A static React build is simpler and faster:

```nginx
server {
    listen 443 ssl http2;
    server_name portal.growthavenues.in;
    root /var/www/portal;
    index index.html;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    location / {
        try_files $uri /index.html;   # client-side routing
    }
}
```

`try_files $uri /index.html` is what makes `/clients/42` load the app instead of a 404 when someone refreshes. Fingerprinted assets get a year of caching; `index.html` does not.

## Lock the back office down at Nginx

The admin app is only used from the office and a VPN. Nginx refuses everyone else before the app even loads:

```nginx
location / {
    allow 203.0.113.10;     # office
    allow 10.8.0.0/24;      # VPN
    deny  all;
    try_files $uri /index.html;
}
```

This is in addition to login and roles in the app, not instead of them. Defence in layers; the first layer costs three lines.

## Certificates for all hosts in one go

```bash
sudo certbot --nginx -d www.growthavenues.in -d growthavenues.in \
  -d portal.growthavenues.in -d admin.growthavenues.in -d api.growthavenues.in
```

One command, one renewal timer. Add a host later with the same command plus `--expand`.

## PM2 with a process file

Keep the two Node apps in one `ecosystem.config.js` so a reboot brings both back in the right order with the right environment:

```js
module.exports = {
  apps: [
    { name: "web", cwd: "/var/apps/web", script: "node_modules/.bin/next", args: "start -p 3000", env: { NODE_ENV: "production" } },
    { name: "api", cwd: "/var/apps/api", script: "src/server.js", env: { NODE_ENV: "production", PORT: 4000 }, max_memory_restart: "400M" },
  ],
};
```

```bash
pm2 start ecosystem.config.js && pm2 save
```

`max_memory_restart` is a safety net for a leak you have not found yet. It has fired exactly once in two years and that once was worth it.

## Separate hosts, or paths?

I chose subdomains over paths like `/admin` because cookies, CORS and caching are all cleaner when each app has its own origin, and because the IP restriction above is one `location` block instead of an exception in a shared one. The cost is a few more DNS records.

## Checks before you call it done

```bash
sudo nginx -t                      # config valid
curl -I https://api.growthavenues.in/health
pm2 status
sudo ss -tlnp | grep -E '3000|4000' # should show 127.0.0.1 only, not 0.0.0.0
```

That last line is the one people skip. If a Node app listens on `0.0.0.0`, it is reachable on its port directly, bypassing TLS and the IP rules. Bind to `127.0.0.1` in the app or block the ports with the firewall.

## Sources

- Nginx server names and virtual hosts: [nginx.org/en/docs/http/server_names.html](https://nginx.org/en/docs/http/server_names.html)
- `try_files`: [nginx.org/en/docs/http/ngx_http_core_module.html#try_files](https://nginx.org/en/docs/http/ngx_http_core_module.html#try_files)
- Access control by IP: [nginx.org/en/docs/http/ngx_http_access_module.html](https://nginx.org/en/docs/http/ngx_http_access_module.html)
- PM2 ecosystem file: [pm2.keymetrics.io/docs/usage/application-declaration](https://pm2.keymetrics.io/docs/usage/application-declaration/)
