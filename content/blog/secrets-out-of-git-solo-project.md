---
title: "Keeping secrets out of git on a one-person project"
description: "No team, no secrets manager, five projects with database keys. The small set of habits that has kept a key out of every repository I have pushed, and what to do in the first ten minutes if one gets in anyway."
date: 2027-05-03T03:30:00Z
tags: [security, git, deployment, process]
keywords: [keep secrets out of git, env file gitignore, rotate leaked api key, git secret scanning, environment variables vercel vps]
---

Every project I run has a handful of secrets: a database connection string, an email password, a service account for push notifications. A solo developer has no one to review the commit that would leak one. These habits are what stand in for that reviewer.

## The one rule

Secrets live in environment variables. Code reads `process.env`. The file that holds them locally is ignored by git before it exists.

```bash
# first commit of every project
printf '.env*\n!.env.example\n' >> .gitignore
git add .gitignore && git commit -m "ignore env files"
```

`.env.example` is committed, with every key and no values:

```
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SECRET_KEY=
GMAIL_APP_PASSWORD=
```

It documents what the app needs, and it is the file you copy to `.env.local` on a new machine.

## The prefix trap

In Next.js, anything named `NEXT_PUBLIC_` is compiled into the browser bundle. Vite does the same with `VITE_`. Never prefix a secret. The publishable Supabase key is meant to be public; the service role key is not, and naming it `NEXT_PUBLIC_SUPABASE_SECRET_KEY` publishes it to everyone.

## Where secrets go in production

- **Vercel**: Project settings, Environment Variables, marked Sensitive so the dashboard will not show them again. Separate values for Production and Preview.
- **A VPS**: in `.env` owned by the deploy user with `chmod 600`, or in the PM2 ecosystem file's `env` block, which itself is outside the repository.
- **Never**: in the Dockerfile, in a committed `ecosystem.config.js`, in a script in the repository "just for now".

## Catch it before the push

A pre-commit hook that refuses obvious keys costs nothing. gitleaks is the tool I use; this configuration blocks the commit if it finds a secret-shaped string:

```bash
brew install gitleaks   # or download the binary
cat > .git/hooks/pre-commit <<'EOF'
#!/bin/sh
gitleaks protect --staged --redact
EOF
chmod +x .git/hooks/pre-commit
```

GitHub's own secret scanning is on for public repositories and can be enabled for private ones. It emails you when it sees a known key format. Turn it on; it is a second net.

## Keys that must be in the browser

A Google Maps key or a Firebase web config is public by nature. Restrict it instead of hiding it: in the provider's console, limit the key to your domains and to the APIs it needs. A restricted public key is fine; an unrestricted one gets stolen and billed to you.

## The first ten minutes after a leak

A key in a commit is leaked the moment it is pushed, even if you force-push over it. Bots pull new commits from GitHub within minutes.

1. **Rotate the key.** Generate a new one at the provider, update the environment, deploy. This is the only step that matters.
2. Revoke the old one.
3. Check the provider's logs for use you do not recognise.
4. Then, and only then, clean the history if you want to, with `git filter-repo`. It is cosmetic; the key is already dead.

I have done this once, for a Gmail app password that ended up in a chat transcript rather than a repository. Rotating took three minutes. Not rotating would have cost a mailbox.

## Sources

- Next.js environment variables and the `NEXT_PUBLIC_` prefix: [nextjs.org/docs/app/guides/environment-variables](https://nextjs.org/docs/app/guides/environment-variables)
- gitleaks: [github.com/gitleaks/gitleaks](https://github.com/gitleaks/gitleaks)
- GitHub secret scanning: [docs.github.com/en/code-security/secret-scanning](https://docs.github.com/en/code-security/secret-scanning)
- Vercel sensitive environment variables: [vercel.com/docs/environment-variables/sensitive-environment-variables](https://vercel.com/docs/environment-variables/sensitive-environment-variables)
- git filter-repo: [github.com/newren/git-filter-repo](https://github.com/newren/git-filter-repo)
