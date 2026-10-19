---
title: "A GitHub Actions pipeline for a Node project: typecheck, lint, test, build, then deploy to the VPS"
description: "The pipeline that runs on every push to the Growth Avenues repositories. It takes about three minutes, blocks merges that break the build, and deploys to the VPS over SSH when main goes green. The workflow file, the caching that made it fast, and the secrets setup."
date: 2027-12-20T03:30:00Z
tags: [github-actions, ci, nodejs, deployment, devops]
keywords: [github actions node.js ci, github actions pnpm cache, github actions deploy ssh vps, github actions typecheck lint test, ci pipeline node project]
project: growth-avenues
---

Before CI, "did you run the tests?" was a question in chat. After CI, it is a green tick on the pull request, and a red one blocks the merge button. The whole setup is one YAML file and three repository secrets.

## The workflow

```yaml
# .github/workflows/ci.yml
name: CI
on:
  push: { branches: [main] }
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  check:
    runs-on: ubuntu-latest
    timeout-minutes: 15
    services:
      mongo:
        image: mongo:7
        ports: ["27017:27017"]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
        env: { MONGO_URL: mongodb://127.0.0.1:27017/test }
      - run: pnpm build

  deploy:
    needs: check
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: webfactory/ssh-agent@v0.9.0
        with: { ssh-private-key: ${{ secrets.DEPLOY_KEY }} }
      - run: ssh-keyscan -H ${{ secrets.DEPLOY_HOST }} >> ~/.ssh/known_hosts
      - run: ssh deploy@${{ secrets.DEPLOY_HOST }} 'bash -s' < scripts/deploy.sh
```

## The parts that matter

**`concurrency` with `cancel-in-progress`.** Push three commits in a row and only the last one's run finishes. Saves minutes per day and keeps the queue short.

**`cache: pnpm` on setup-node.** Restores the pnpm store between runs, keyed on the lockfile. Install went from 70 seconds to 8.

**A real MongoDB as a service container.** The integration tests run against a real database, not mocks, because the bugs they catch are in queries. The service is up before the steps start and thrown away after.

**Order: typecheck, lint, test, build.** Cheapest and most likely to fail first. A type error fails in 20 seconds instead of after a 90-second build.

**`needs: check` and the branch condition.** Deploy runs only when checks pass, only on `main`, only for a push, not a pull request. Pull requests from forks cannot reach the deploy job or its secrets.

**`environment: production`.** The secrets live on the environment, not the repository, and the environment can require a reviewer's approval before the job runs if a client wants a human gate.

## The deploy script

`scripts/deploy.sh` is the same script from the VPS deployment post, run over SSH as the `deploy` user: pull, install, build, `pm2 reload`. The private key in `DEPLOY_KEY` is a dedicated keypair whose public key is in that user's `authorized_keys`, restricted with `command=` so it can run only the deploy script:

```
command="/home/deploy/bin/deploy.sh",no-port-forwarding,no-pty ssh-ed25519 AAAA... ci@github
```

Even with the key leaked, an attacker can trigger a deploy of whatever is on `main` and nothing else.

## Branch protection

In the repository settings: require the `check` job to pass before merging to `main`, and require a pull request. That is what turns the green tick from information into a gate.

## Things I added later

- **A `pnpm audit --audit-level=high` step**, allowed to fail but visible, so dependency advisories show up in the log.
- **Playwright E2E** on a separate job for the frontend, running only on pull requests touching `apps/web`, because the full suite takes six minutes.
- **A Slack message on deploy** via a webhook, with the commit message, so the team knows what went out.

## Sources

- GitHub Actions workflow syntax: [docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- Service containers: [docs.github.com/en/actions/use-cases-and-examples/using-containerized-services/about-service-containers](https://docs.github.com/en/actions/use-cases-and-examples/using-containerized-services/about-service-containers)
- `actions/setup-node` caching: [github.com/actions/setup-node#caching-global-packages-data](https://github.com/actions/setup-node#caching-global-packages-data)
- Deployment environments and protection rules: [docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment](https://docs.github.com/en/actions/managing-workflow-runs-and-deployments/managing-deployments/managing-environments-for-deployment)
- SSH `authorized_keys` command restriction: [man.openbsd.org/sshd#AUTHORIZED_KEYS_FILE_FORMAT](https://man.openbsd.org/sshd#AUTHORIZED_KEYS_FILE_FORMAT)
