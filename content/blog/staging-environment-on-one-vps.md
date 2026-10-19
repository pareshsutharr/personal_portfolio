---
title: "A staging environment on the same VPS: separate ports, databases and domains, one server"
description: "Clients want to see a change before it goes live, and a second server for that is money most small projects do not have. How the Growth Avenues platform runs staging next to production on one VPS without the two ever touching: separate users, ports, databases, env files and subdomains, and the deploy script that knows which is which."
date: 2027-12-27T03:30:00Z
tags: [deployment, linux, nginx, pm2, devops]
keywords: [staging environment same server, staging and production one vps, nginx staging subdomain, pm2 multiple environments, staging environment small project]
project: growth-avenues
image: /blog/stock/containers-3.webp
imageAlt: "Container cranes at dusk"
imageCredit: "Syced"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Container_cranes_in_Tokyo_Bay.jpg"
imageLicense: "CC0"
---

"Can I see it before it goes live?" is a reasonable thing for a client to ask, and "no, we only have one server" is a bad answer. The Growth Avenues VPS has run a staging copy next to production for two years. The isolation is not perfect, a shared kernel and shared RAM cannot be, but no staging mistake has ever reached production data, and that is the bar.

## The separation

| | Production | Staging |
|---|---|---|
| Linux user | `ga` | `ga-staging` |
| Code | `/home/ga/app` | `/home/ga-staging/app` |
| Port | 4000 | 4100 |
| Database | `ga_prod` | `ga_staging` |
| Env file | `/home/ga/app/.env` | `/home/ga-staging/app/.env` |
| Domain | `app.growthavenues.in` | `staging.growthavenues.in` |
| PM2 | `ga-api`, `ga-web` under user `ga` | `ga-api`, `ga-web` under user `ga-staging` |
| Branch | `main` | `staging` |

Two Linux users is the piece people skip. PM2 runs per user, so staging processes cannot see or touch production's; file permissions keep each user out of the other's home; and a `sudo -u ga-staging` in a deploy script cannot accidentally reload production.

## Database

Same MongoDB instance, two databases, two users with access only to their own:

```js
use ga_staging
db.createUser({ user: "ga_staging", pwd: "...", roles: [{ role: "readWrite", db: "ga_staging" }] })
```

Staging gets a copy of production data, with personal fields scrubbed, refreshed on request:

```bash
mongodump --uri "$PROD_URL" --archive | mongorestore --uri "$STAGING_URL" --archive --drop --nsFrom 'ga_prod.*' --nsTo 'ga_staging.*'
mongosh "$STAGING_URL" scripts/scrub.js   # replaces emails, phones, bank details with fakes
```

The scrub is not optional. Staging has looser access than production, more people poke at it, and its logs are read less carefully.

## Nginx

Two server blocks, two certificates, same config shape:

```nginx
server {
  server_name staging.growthavenues.in;
  location /api/ { proxy_pass http://127.0.0.1:4100/; }
  location /     { proxy_pass http://127.0.0.1:4101; }
  add_header X-Robots-Tag "noindex, nofollow" always;
  auth_basic "Staging";
  auth_basic_user_file /etc/nginx/staging.htpasswd;
  # ssl lines from certbot
}
```

Basic auth keeps the public and search engines out, and the `X-Robots-Tag` header makes sure a leaked link does not get indexed. Production's block has neither.

## Email and third parties

The one way staging has hurt a client, on a different project, was by sending real email. Staging's env sets the mail provider to sandbox mode and the SMS gateway to a test key, and the email helper refuses to send to any address not ending in the company's own domain when `APP_ENV=staging`. Payment gateways point at their test environments. Every external integration has a line in the env file, and staging's values are all the test ones.

## The deploy script knows the environment

```bash
#!/usr/bin/env bash
set -euo pipefail
ENV="${1:?usage: deploy.sh prod|staging}"
case "$ENV" in
  prod)    USER=ga;         BRANCH=main ;;
  staging) USER=ga-staging; BRANCH=staging ;;
  *) echo "unknown env"; exit 1 ;;
esac
sudo -u "$USER" -H bash -c "cd ~/app && git fetch && git checkout $BRANCH && git pull && pnpm install --frozen-lockfile && pnpm build && pm2 reload ecosystem.config.cjs --update-env"
```

CI calls `deploy.sh staging` on pushes to `staging` and `deploy.sh prod` on pushes to `main`. Promoting a change is a merge from `staging` to `main`, which is the review step the client asked for.

## Resource limits

Staging is for looking, not load. PM2 runs it with one instance and a 300 MB memory cap; production has two instances and 600 MB. If staging ever gets busy enough to matter, that is the day it deserves its own server.

## What this does not give you

Identical performance characteristics, since the two share CPU; protection from a kernel-level fault; or a way to test a server migration. For a small product, none of those have mattered yet. The thing that matters is that a client can click through a change on Thursday and it goes live on Friday with no surprises.

## Sources

- PM2 ecosystem files and per-user daemons: [pm2.keymetrics.io/docs/usage/application-declaration](https://pm2.keymetrics.io/docs/usage/application-declaration/)
- Nginx basic auth: [docs.nginx.com/nginx/admin-guide/security-controls/configuring-http-basic-authentication](https://docs.nginx.com/nginx/admin-guide/security-controls/configuring-http-basic-authentication/)
- MongoDB per-database users: [mongodb.com/docs/manual/tutorial/create-users](https://www.mongodb.com/docs/manual/tutorial/create-users/)
- `mongorestore` namespace remapping: [mongodb.com/docs/database-tools/mongorestore/#std-option-mongorestore.--nsFrom](https://www.mongodb.com/docs/database-tools/mongorestore/#std-option-mongorestore.--nsFrom)
