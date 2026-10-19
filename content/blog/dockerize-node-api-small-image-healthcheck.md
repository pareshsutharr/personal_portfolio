---
title: "Docker for a Node.js API: a small image, a non-root user, and a health check that means something"
description: "The first Dockerfile I wrote for the Growth Avenues API produced a 1.4 GB image that ran as root and reported healthy while MongoDB was unreachable. The current one is 180 MB, runs as an unprivileged user, and fails its health check when it cannot serve requests. Every line, and why it is there."
date: 2027-12-13T03:30:00Z
tags: [docker, nodejs, deployment, devops]
keywords: [dockerfile node.js production, docker multi-stage build node, docker non-root user node, docker healthcheck node api, reduce docker image size node]
project: growth-avenues
---

Docker was not the first way I deployed Node, and the VPS posts on this blog still run PM2 directly for most things. But two clients wanted containers, and getting a Node API into a container that is small, safe and honest about its health took a few iterations. This is the Dockerfile that came out of them.

## The Dockerfile

```dockerfile
# ---- deps: install with the lockfile, production only ----
FROM node:22-alpine AS deps
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# ---- build: compile TypeScript ----
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- runtime: only what is needed to run ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
RUN addgroup -S app && adduser -S app -G app
COPY --from=deps  --chown=app:app /app/node_modules ./node_modules
COPY --from=build --chown=app:app /app/dist ./dist
COPY --chown=app:app package.json ./
USER app
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/health || exit 1
CMD ["node", "dist/server.js"]
```

## Why three stages

The build stage has dev dependencies and TypeScript. The deps stage has only production dependencies. The runtime stage copies from both and keeps neither's toolchain. From 1.4 GB on `node:22` with everything, to 180 MB on `alpine` with only `dist` and production `node_modules`.

If a native module refuses to build on Alpine, `node:22-slim` is the fallback: Debian-based, about 60 MB larger, far fewer surprises.

## Why a non-root user

A container running as root that gets compromised through, say, a dependency vulnerability, has root inside the container and a shorter path to the host. `adduser -S app` and `USER app` cost nothing. The `--chown` flags on the copies matter: without them the files belong to root and the app user cannot write where it might need to, such as a temp directory for PDF generation.

## Why the health check hits a real endpoint

```js
app.get("/health", async (req, res) => {
  const checks = { mongo: mongoose.connection.readyState === 1 };
  const ok = Object.values(checks).every(Boolean);
  res.status(ok ? 200 : 503).json({ ok, checks, uptime: process.uptime() });
});
```

A health check that only confirms the process is up tells the orchestrator nothing useful: the API was "healthy" for twenty minutes once while MongoDB was down, so nothing restarted and nobody was paged. Checking the database connection state turns the health check into "can I serve requests". Keep it cheap: no queries, just state. `start-period` gives the app time to connect before failures count.

## .dockerignore

```
node_modules
dist
.git
.env*
*.md
coverage
```

Without it, `COPY . .` sends the local `node_modules` and the `.env` file into the build context. The first is slow; the second is a secret in an image layer.

## Running it

```bash
docker build -t ga-api:$(git rev-parse --short HEAD) .
docker run -d --name ga-api --restart unless-stopped -p 127.0.0.1:4000:4000 \
  --env-file /etc/ga-api.env --memory 512m ga-api:abc1234
docker inspect --format '{{.State.Health.Status}}' ga-api
```

Tagged with the commit, bound to localhost so Nginx fronts it, environment from a file outside the image, and a memory cap so a leak cannot take the host down.

## Signals and clean shutdown

`CMD ["node", "dist/server.js"]` in exec form means Node is PID 1 and receives `SIGTERM` directly. The server handles it: stop accepting connections, finish in-flight requests, close MongoDB, exit. With shell form (`CMD node dist/server.js`) the shell gets the signal and Node does not, and `docker stop` waits ten seconds then kills it mid-request.

## Sources

- Node.js Docker best practices: [github.com/nodejs/docker-node/blob/main/docs/BestPractices.md](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- Docker multi-stage builds: [docs.docker.com/build/building/multi-stage](https://docs.docker.com/build/building/multi-stage/)
- Dockerfile `HEALTHCHECK`: [docs.docker.com/reference/dockerfile/#healthcheck](https://docs.docker.com/reference/dockerfile/#healthcheck)
- Snyk's Node Docker checklist: [snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker](https://snyk.io/blog/10-best-practices-to-containerize-nodejs-web-applications-with-docker/)
