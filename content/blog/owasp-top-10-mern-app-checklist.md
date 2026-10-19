---
title: "The OWASP Top 10, applied to a MERN app: where each one actually shows up and the fix I ship"
description: "The OWASP list is written for every kind of software. This is the version for a MongoDB, Express, React and Node project: for each category, the concrete place it appeared in a real codebase of mine or a client's, and the code or setting that closed it. A checklist I run before a handover."
date: 2028-03-20T03:30:00Z
tags: [security, owasp, express, mongodb, react]
keywords: [owasp top 10 node.js, mern stack security checklist, express security best practices, nosql injection mongodb express, react xss prevention]
project: growth-avenues
image: /blog/stock/security-3.webp
imageAlt: "Old iron latch on weathered wooden boards"
imageCredit: "Estormiz"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Padlock_Valimokatu_Oulu_20250307_01.jpg"
imageLicense: "CC0"
---

The OWASP Top 10 is the list everyone cites and few map to their actual stack. Here is the mapping for the stack I use most, with the place each category turned up in real code. Nothing here is theoretical.

## A01 Broken access control

**Where it showed up:** `GET /clients/:id` returned any client to any logged-in user. The check was for "logged in", not "owns this client".

**Fix:** every query scoped to the caller. `Client.findOne({ _id, distributor: req.user.id })`, never `findById` on tenant data. Plus a `requireRole` middleware on admin routes and the three-layer check from the Next.js auth post. This is the most common category in code review by a wide margin.

## A02 Cryptographic failures

**Where:** passwords hashed with MD5 in a legacy codebase I inherited; a JWT secret of `secret`.

**Fix:** `argon2id` or `bcrypt` with cost 12 for passwords; 256-bit random secrets from `openssl rand -base64 32` in environment variables; TLS everywhere via Certbot; sensitive fields such as bank account numbers encrypted at rest with a key outside the database.

## A03 Injection

**Where:** `User.findOne({ email: req.body.email, password: req.body.password })` with `{ "$gt": "" }` as the password. Logged in as the first user. NoSQL injection is real and takes one request.

**Fix:** validate every input with Zod so a string field cannot arrive as an object; `express-mongo-sanitize` as a belt-and-braces layer; never build `$where` or aggregation stages from user input. For the rare raw SQL on Postgres projects, parameterised queries only.

## A04 Insecure design

**Where:** a password reset that emailed the old password. Design, not a bug.

**Fix:** the reset flow in the next post: random token, hashed in the database, single use, short expiry. More generally, the threat model conversation at the start: who are the users, what must they never see, what happens when a phone is stolen.

## A05 Security misconfiguration

**Where:** `NODE_ENV` unset in production, so Express sent stack traces; MongoDB bound to `0.0.0.0` with no auth; CORS `origin: "*"` with credentials.

**Fix:** `NODE_ENV=production` in the PM2 ecosystem file; MongoDB on `127.0.0.1` with a user per database; CORS with an explicit origin list; the security headers post; default admin accounts removed before go-live.

## A06 Vulnerable and outdated components

**Where:** a `lodash` version with a prototype pollution advisory, three years old, in a dependency of a dependency.

**Fix:** `pnpm audit` in CI, Dependabot or Renovate opening update PRs weekly, and a rule that major upgrades happen within a quarter of release. Lock files committed. `pnpm install --frozen-lockfile` in production so the deployed tree is the reviewed tree.

## A07 Identification and authentication failures

**Where:** no rate limit on login, so a credential list ran unbothered; sessions that never expired; "remember me" implemented by storing the password in `localStorage`.

**Fix:** rate limiting on `/login` by IP and by account; sessions with an idle timeout and absolute lifetime; refresh tokens rotated on use; OTP as a second factor for admin roles. Each has its own post in this series.

## A08 Software and data integrity failures

**Where:** a deploy script that `curl | bash`-ed an installer; a webhook handler that trusted the payload without verifying the signature.

**Fix:** pinned versions and checksums for anything downloaded during deploy; webhook signatures verified with `timingSafeEqual`; CI that builds from the reviewed commit, not from a developer's machine.

## A09 Security logging and monitoring failures

**Where:** a client's HRMS had a salary edit nobody could attribute. No audit log, no login log, no alerts.

**Fix:** the audit log post; failed logins logged with IP; an alert when failed logins for an account exceed a threshold in ten minutes; logs shipped off the box so an intruder cannot erase them.

## A10 Server-side request forgery

**Where:** an "import from URL" feature that fetched whatever URL the user gave. Pointed at `http://169.254.169.254/` on a cloud host, it would have returned instance credentials.

**Fix:** allow-list of hosts for any server-side fetch of a user-supplied URL; resolve DNS and reject private and link-local ranges; no redirects followed; a short timeout.

## The React side

React escapes text by default, so XSS mostly arrives through `dangerouslySetInnerHTML`, `href="javascript:"`, and markdown renderers. This blog renders Markdown through a sanitiser; links are checked to start with `http` or `/`; and `dangerouslySetInnerHTML` is grep-able and reviewed on every use.

## The checklist

Before a handover, I run through the ten with the codebase open and write a one-line answer per item. If an answer is "not applicable", it has to say why. Takes an hour, and it has found something every single time.

## Sources

- OWASP Top 10: [owasp.org/Top10](https://owasp.org/Top10/)
- OWASP Node.js security cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Nodejs_Security_Cheat_Sheet.html)
- MongoDB security checklist: [mongodb.com/docs/manual/administration/security-checklist](https://www.mongodb.com/docs/manual/administration/security-checklist/)
- Express production security: [expressjs.com/en/advanced/best-practice-security.html](https://expressjs.com/en/advanced/best-practice-security.html)
- OWASP SSRF prevention: [cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
