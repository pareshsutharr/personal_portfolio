---
title: "Role changes that take effect now: short tokens, a deny list, and a version number"
description: "A stateless JWT is valid until it expires, even after you demote the user or they click sign out everywhere. On a fintech platform that is not acceptable. The three mechanisms I combine so a revoked session is dead within seconds, with the cost of each."
date: 2027-06-21T03:30:00Z
tags: [jwt, security, express, nodejs, redis]
keywords: [jwt revoke token, invalidate jwt on logout, jwt deny list redis, force logout all devices jwt, token version user]
project: growth-avenues
---

The convenient thing about JWTs is that the server does not need to look anything up to trust one. The inconvenient thing is the same sentence. When compliance removes someone's access at 3 pm, a token issued at 2:50 pm keeps working until it expires. The first post in this series used 15-minute access tokens to bound that window. This one closes it.

## Mechanism 1: short access tokens, the baseline

Fifteen minutes means a revoked user has at most fifteen minutes. For most roles on most apps that is acceptable, and it costs nothing. It is not acceptable for "this person was just terminated". So:

## Mechanism 2: a token version on the user

Each user carries an integer. It goes into every access token. Any security event bumps it: password change, role change, sign out everywhere, admin revocation.

```js
// issuing
jwt.sign({ sub: user.id, role: user.role, v: user.tokenVersion }, SECRET, { expiresIn: "15m" });

// on password change, role change, or "sign out everywhere"
await User.updateOne({ _id: userId }, { $inc: { tokenVersion: 1 } });
await RefreshToken.deleteMany({ user: userId });
```

Checking it requires a lookup per request, which is what JWTs were avoiding. The lookup is one indexed read on a tiny document, and it can be cached for a few seconds:

```js
const versionCache = new Map(); // userId -> { v, until }

async function currentVersion(userId) {
  const hit = versionCache.get(userId);
  if (hit && hit.until > Date.now()) return hit.v;
  const u = await User.findById(userId).select("tokenVersion").lean();
  versionCache.set(userId, { v: u?.tokenVersion ?? -1, until: Date.now() + 5000 });
  return u?.tokenVersion ?? -1;
}

export async function requireAuth(req, res, next) {
  // ...verify the JWT as before...
  if (payload.v !== (await currentVersion(payload.sub))) return res.status(401).json({ error: "Session expired" });
  req.user = { id: payload.sub, role: payload.role };
  next();
}
```

Five seconds of cache turns "stateless" into "revoked within five seconds", at the cost of one small query per user per five seconds. On the Growth Avenues API that is unmeasurable.

With PM2 cluster mode, each process has its own `Map`. That is fine; the worst case is still five seconds.

## Mechanism 3: a deny list for single tokens

Sometimes you want to kill one token, not all of a user's sessions: a laptop reported stolen while the phone stays signed in. Put the token's `jti` (a unique id you add at signing) in a store with a TTL equal to the token's remaining life:

```js
// signing
jwt.sign({ sub, role, v, jti: randomUUID() }, SECRET, { expiresIn: "15m" });

// revoking one token
await redis.set(`deny:${jti}`, "1", "EX", secondsUntilExpiry);

// checking
if (await redis.exists(`deny:${jti}`)) return res.status(401).json({ error: "Session expired" });
```

Redis is the natural home because of the TTL; entries clean themselves up. Without Redis, a MongoDB collection with a TTL index does the same thing a little more slowly.

## Which to use

| Need | Mechanism |
| --- | --- |
| Most apps, most roles | Short tokens only |
| Role change or password change applies immediately | Token version |
| Sign out everywhere | Token version |
| Revoke one device | Deny list |
| Regulated system, access removal must be immediate | Version with a short cache, plus deny list |

The Growth Avenues API uses all three. The version check is the one that matters day to day; the deny list has been used a handful of times.

## Do not forget the refresh token

Revoking access tokens while leaving refresh tokens alive just delays the problem by fifteen minutes. Every mechanism above pairs with deleting the user's stored refresh tokens, which is one query because they are in the database.

## Sources

- JWT `jti` claim: [datatracker.ietf.org/doc/html/rfc7519#section-4.1.7](https://datatracker.ietf.org/doc/html/rfc7519#section-4.1.7)
- Redis `SET` with expiry: [redis.io/docs/latest/commands/set](https://redis.io/docs/latest/commands/set/)
- MongoDB TTL indexes: [mongodb.com/docs/manual/core/index-ttl](https://www.mongodb.com/docs/manual/core/index-ttl/)
- OWASP JWT cheat sheet, token revocation: [cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#token-explicit-revocation-by-the-user](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html#token-explicit-revocation-by-the-user)
