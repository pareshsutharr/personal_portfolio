---
title: "Deploying a Node.js app on a Linux VPS with Nginx, PM2 and SSL"
description: "The exact server setup I use for the Growth Avenues platform: one Ubuntu VPS, Nginx in front, PM2 keeping Node alive, free SSL from Let's Encrypt, and a firewall that only opens what it must."
date: 2026-10-19T03:30:00Z
tags: [nodejs, nginx, pm2, linux, deployment]
keywords: [deploy node.js app on vps, nginx reverse proxy node, pm2 production, ubuntu ssl certbot, deploy express app ubuntu]
project: growth-avenues
image: /blog/stock/servers-1.webp
imageAlt: "Server racks with cabling in a small computer room"
imageCredit: "Jemimus"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:DHL_Netherlands_local_site_computer_room_server_racks_(2)_-_IMG_3299.jpg"
imageLicense: "CC BY 2.0"
summary: "One Ubuntu VPS with Nginx reverse-proxying to a Node process kept alive by PM2, a free Let's Encrypt certificate from Certbot, and a firewall that opens only 22, 80 and 443. About forty minutes the first time and the same setup serves every backend I run."
faq:
  - q: "Do I need Docker to deploy a Node app on a VPS?"
    a: "No. Nginx plus PM2 on the host is simpler to operate for a single app and is what runs the Growth Avenues platform."
  - q: "How does the app survive a reboot?"
    a: "pm2 startup registers a systemd service and pm2 save records the process list, so PM2 restores the app after the server restarts."
  - q: "How do I renew the SSL certificate?"
    a: "Certbot installs a timer that renews automatically. Check it once with certbot renew --dry-run."
---

Every backend I run in production sits behind the same setup: an Ubuntu VPS, Nginx taking the traffic on ports 80 and 443, PM2 keeping the Node.js process alive, and Let's Encrypt for the certificate. I have done this for the Growth Avenues platform, for client sites, and for side projects. It costs a few hundred rupees a month and it has never been the thing that broke.

This is the whole procedure, in the order I actually do it. Budget about forty minutes the first time.

## What you need

- A VPS running Ubuntu 22.04 or 24.04. DigitalOcean, Linode, Hetzner and Hostinger all work. One vCPU and 1 GB of RAM is enough for a typical Express API.
- A domain with an A record pointing at the server's IP. Set this early, because DNS takes time to spread and the SSL step needs it.
- Your app listening on a port like 3000, reading its secrets from environment variables.

## 1. Lock down the server first

Log in as root once, create a user, and never log in as root again.

```bash
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
```

Now log in as `deploy` and turn on the firewall. Only three ports should be open: SSH, HTTP and HTTPS. Your Node app's port stays closed to the world; Nginx talks to it over localhost.

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

If you skip this, your API is reachable on port 3000 directly, with no TLS and no rate limiting. I have seen that on more "finished" servers than I would like.

## 2. Install Node.js and PM2

Use the NodeSource build so you get a current LTS rather than whatever Ubuntu ships.

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

PM2 does three things you want: restarts the app when it crashes, restarts it when the server reboots, and keeps logs you can read later.

## 3. Get the code on the server

Clone the repository into the deploy user's home, install dependencies, and create the environment file. Keep secrets in `.env` on the server, never in git.

```bash
cd ~
git clone git@github.com:you/your-api.git
cd your-api
npm ci --omit=dev
nano .env   # PORT=3000, MONGODB_URI=..., JWT_SECRET=...
```

Start it under PM2 and save the process list so it survives a reboot.

```bash
pm2 start src/server.js --name api
pm2 save
pm2 startup   # prints one command; run it with sudo
```

Check it is alive from the server itself:

```bash
curl -s http://localhost:3000/health
```

If that fails, the problem is your app, not the server. Fix it before going further. `pm2 logs api` shows you why.

## 4. Put Nginx in front

Install Nginx and write one server block. This is the part people copy wrong, so here is a complete, working one.

```bash
sudo apt-get install -y nginx
sudo nano /etc/nginx/sites-available/api.example.com
```

```nginx
server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_set_header   Upgrade           $http_upgrade;
        proxy_set_header   Connection        "upgrade";
        proxy_read_timeout 60s;
    }
}
```

The two `Upgrade` and `Connection` lines matter if you use WebSockets or Socket.IO; without them the connection falls back to long polling and you will spend an afternoon wondering why.

Enable it and reload.

```bash
sudo ln -s /etc/nginx/sites-available/api.example.com /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

`nginx -t` is the habit that saves you. It tells you about a typo before Nginx goes down because of it.

## 5. Add SSL with Certbot

Certbot edits the server block for you, adds the certificate and sets up renewal.

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d api.example.com
```

Choose the redirect option when it asks, so plain HTTP sends people to HTTPS. Renewal runs on a timer; confirm it with `sudo certbot renew --dry-run`.

## 6. Make your app trust the proxy

Because Nginx sits in front, your app sees every request as coming from 127.0.0.1 unless you tell Express to read the forwarded headers. Rate limiters and IP logging are wrong without this.

```js
app.set("trust proxy", 1);
```

## Updating later

My deploy for a new version is four commands. I have not needed anything fancier for a single-server app.

```bash
cd ~/your-api && git pull
npm ci --omit=dev
pm2 reload api
pm2 logs api --lines 50
```

`pm2 reload` restarts without dropping in-flight requests, which `pm2 restart` does not promise.

## Things that bit me

- **DNS not ready.** Certbot fails with a validation error if the A record has not spread yet. Wait, do not retry ten times; Let's Encrypt rate-limits you.
- **Nginx 502 Bad Gateway.** Nine times out of ten the Node process is down. `pm2 status` first, then `pm2 logs`.
- **Large uploads rejected.** Nginx defaults to a 1 MB body. Add `client_max_body_size 20m;` inside the server block if you accept file uploads.
- **Time drift.** JWTs with short expiry misbehave on a server whose clock is wrong. `timedatectl` shows it; `sudo timedatectl set-ntp true` fixes it.

## Sources

- Nginx reverse proxy guide: [nginx.org/en/docs/http/ngx_http_proxy_module.html](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- PM2 process management: [pm2.keymetrics.io/docs/usage/quick-start](https://pm2.keymetrics.io/docs/usage/quick-start/)
- Certbot instructions for Nginx on Ubuntu: [certbot.eff.org](https://certbot.eff.org/)
- Express behind proxies: [expressjs.com/en/guide/behind-proxies.html](https://expressjs.com/en/guide/behind-proxies.html)
- UFW basics: [help.ubuntu.com/community/UFW](https://help.ubuntu.com/community/UFW)
