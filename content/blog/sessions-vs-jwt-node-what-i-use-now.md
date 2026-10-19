---
title: "Sessions or JWTs? What I use now for web apps, for mobile apps, and for the one case where both are wrong"
description: "I shipped JWT-only auth for years because every tutorial did. Then a client needed 'log out everywhere' and a JWT could not do it. The honest comparison from running both in production: server sessions in a store for web apps, short JWTs with rotating refresh tokens for mobile, and the sessionVersion trick that gives JWTs a kill switch."
date: 2028-04-10T03:30:00Z
tags: [auth, security, nodejs, express, jwt]
keywords: [jwt vs session authentication, express session store redis, refresh token rotation node, jwt logout invalidate, httponly cookie auth next.js]
project: growth-avenues
image: /blog/stock/security-1.webp
imageAlt: "Padlock on a wooden door"
imageCredit: "Quim Gil"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Abloy_padlock_in_Oulu.jpg"
imageLicense: "CC0"
summary: "Use server sessions in Redis with an HttpOnly cookie for browser apps, and short JWTs with rotating refresh tokens for mobile apps. A session version on the user gives JWTs a kill switch, and server-to-server callers get API keys instead of either."
faq:
  - q: "Can I log a user out everywhere with JWTs?"
    a: "Only by adding state: carry a session version in the token, bump it on password change or sign-out-everywhere, and compare it on every request from a cached lookup."
  - q: "Why use sessions for web apps if JWTs are stateless?"
    a: "Revocation, listing active logins and idle timeouts are trivial with a session store, and one Redis read per request costs under a millisecond."
  - q: "What is refresh token rotation and why does it matter?"
    a: "Each refresh issues a new token and marks the old one used. A used token presented again means theft, so the whole token family is revoked."
---

The question "JWT or sessions?" has a tribal answer on every forum and a practical answer in every codebase that has had to revoke access in a hurry. Here is what I run now and why, after having been bitten by the wrong choice on both sides.

## What each one actually is

A **session** is a random id in a cookie that points at a record on the server. The server owns the state. To log someone out, delete the record. To see who is logged in, list the records.

A **JWT** is a signed statement, "this is user 42 with role admin, valid until 3 pm", that the server can verify without looking anything up. The client owns the state. To log someone out before 3 pm, you need something extra, because the token is still valid on its face.

That one difference decides almost everything.

## Web apps: sessions, in Redis, in an HttpOnly cookie

The HRMS, the CRM and the client portal are browser apps on the same domain as their API. They use sessions:

```js
import session from "express-session";
import { RedisStore } from "connect-redis";

app.set("trust proxy", 1);
app.use(session({
  store: new RedisStore({ client: redis, prefix: "sess:" }),
  secret: process.env.SESSION_SECRET,
  name: "ga.sid",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { httpOnly: true, secure: true, sameSite: "lax", maxAge: 8 * 60 * 60 * 1000 },
}));
```

Eight hours of idle timeout, extended on activity by `rolling`. `HttpOnly` means scripts cannot read it, so an XSS cannot steal it. `SameSite=Lax` blocks most CSRF for free. Logout is `req.session.destroy()`. "Log out everywhere" is deleting every `sess:*` key whose user id matches, which the store supports with a small scan, or by keeping a per-user set of session ids.

Every request costs one Redis `GET`, under a millisecond on the same box. That is the price, and it is nothing.

## Mobile apps: short JWT, rotating refresh token

The field-staff Android app cannot use cookies conveniently and talks to the API from anywhere. It gets a JWT:

- **Access token**: 15 minutes, signed, carries `sub`, `role`, `sv` (session version). Sent as `Authorization: Bearer`.
- **Refresh token**: 30 days, random, stored hashed in the database with the device name. Exchanged for a new pair. Rotated on every use: the old one is marked used, and a used token presented again means theft, so the whole family is revoked.

```js
router.post("/auth/refresh", async (req, res) => {
  const presented = sha256(req.body.refreshToken);
  const rt = await RefreshToken.findOne({ tokenHash: presented });
  if (!rt || rt.expiresAt < new Date()) throw new HttpError(401, "Sign in again");
  if (rt.usedAt) { await RefreshToken.updateMany({ family: rt.family }, { revokedAt: new Date() }); throw new HttpError(401, "Sign in again"); }
  rt.usedAt = new Date(); await rt.save();
  const user = await User.findById(rt.user);
  const next = await RefreshToken.create({ user: user._id, family: rt.family, tokenHash: sha256(newToken), expiresAt: in30Days(), device: rt.device });
  res.json({ accessToken: signAccess(user), refreshToken: newToken });
});
```

## The kill switch for JWTs: sessionVersion

A 15-minute token is still 15 minutes of access after a password reset. The access token carries the user's `sessionVersion`, and the auth middleware compares it:

```js
const user = await cache.get(`user:${payload.sub}`) ?? await User.findById(payload.sub).select("sessionVersion role");
if (user.sessionVersion !== payload.sv) throw new HttpError(401, "Session expired");
```

Bump `sessionVersion` on password change, 2FA reset or "log out everywhere", and every token issued before it fails on its next request. It costs a cached lookup per request, which is the same cost as a session, which is the point: a revocable JWT is a session with extra steps. For mobile it is still worth it, because the refresh flow works cleanly without cookies.

## Where both are wrong

Server-to-server calls: a cron job calling the API, a partner integration. Neither sessions nor user JWTs fit. These get API keys: long random strings, stored hashed, scoped to specific routes, with a `last_used_at` for finding dead ones, and rotatable from the admin.

## Next.js on Vercel

This portfolio's admin uses Supabase Auth, which issues a JWT in an HttpOnly cookie and refreshes it server-side; the protected layout verifies it against Supabase on each render. It is the JWT model with the provider owning revocation, and for a one-person admin it is fine. For a client product with a team, I would still put a session store in front.

## Sources

- express-session: [expressjs.com/en/resources/middleware/session.html](https://expressjs.com/en/resources/middleware/session.html)
- connect-redis: [github.com/tj/connect-redis](https://github.com/tj/connect-redis)
- Refresh token rotation and reuse detection: [auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)
- OWASP session management cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- JWT, RFC 7519: [datatracker.ietf.org/doc/html/rfc7519](https://datatracker.ietf.org/doc/html/rfc7519)
