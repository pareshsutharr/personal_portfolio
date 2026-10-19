---
title: "JWT and role-based access in Express, done the boring way"
description: "How I keep distributors, staff and admins apart on a fintech platform: short-lived access tokens, a refresh token in an httpOnly cookie, and two small middlewares that every protected route goes through."
date: 2026-10-26T03:30:00Z
tags: [nodejs, express, jwt, security, rbac]
keywords: [express jwt authentication, role based access control node, jwt refresh token httponly cookie, express authorization middleware, rbac middleware express]
project: growth-avenues
image: /blog/stock/security-1.webp
imageAlt: "Padlock on a wooden door"
imageCredit: "Quim Gil"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Abloy_padlock_in_Oulu.jpg"
imageLicense: "CC0"
summary: "Short-lived access tokens with the user's role inside, a refresh token in an HttpOnly cookie, and two small middlewares: one that verifies the token and one that checks the role. Every protected route goes through both; tenant data is scoped to the caller in the query itself."
faq:
  - q: "Where should the refresh token live?"
    a: "In an HttpOnly, Secure, SameSite cookie so scripts cannot read it. The access token can live in memory."
  - q: "How do I check roles in Express?"
    a: "A requireRole middleware that reads the role from the verified token and returns 403 if it is not in the allowed list for that route."
  - q: "Is checking the role enough?"
    a: "No. A distributor must also only see their own clients, so every query filters by the caller's id, not just the role."
---

On the Growth Avenues platform there are three kinds of people hitting the same API: distributors who should only ever see their own clients, operations staff who see everyone's but cannot change settings, and admins who can. Getting that wrong on a financial product is not a bug, it is a complaint to a regulator.

The setup I landed on is deliberately unexciting. Two tokens, two middlewares, and a permissions table I can read in one screen.

## The shape of it

- **Access token**: a JWT that lives for 15 minutes. Sent in the `Authorization: Bearer` header. Carries the user id and role, nothing else.
- **Refresh token**: a long random string, stored hashed in the database, sent to the browser as an `httpOnly` cookie. Used only to get a new access token.
- **`requireAuth`**: middleware that verifies the access token and attaches `req.user`.
- **`requireRole(...roles)`**: middleware that checks `req.user.role` against the list.

Why two tokens? If an access token leaks, it is useless in 15 minutes. If a refresh token leaks, you can revoke it because you have it in the database. A single long-lived JWT gives you neither.

## Issuing tokens on login

```js
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";

const ACCESS_TTL = "15m";
const REFRESH_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function login(req, res) {
  const user = await User.findOne({ email: req.body.email.toLowerCase() });
  if (!user || !(await bcrypt.compare(req.body.password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const accessToken = jwt.sign(
    { sub: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TTL },
  );

  const refreshToken = crypto.randomBytes(40).toString("hex");
  await RefreshToken.create({
    user: user.id,
    tokenHash: crypto.createHash("sha256").update(refreshToken).digest("hex"),
    expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
  });

  res.cookie("refresh", refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/auth/refresh",
    maxAge: REFRESH_TTL_MS,
  });
  res.json({ accessToken });
}
```

Two details that matter. The refresh cookie's `path` is limited to the refresh endpoint, so it is not sent with every request. And the database stores a hash of the refresh token, so a database leak does not hand out sessions.

Use the same error message for a wrong email and a wrong password. Different messages tell an attacker which emails exist.

## The two middlewares

```js
export function requireAuth(req, res, next) {
  const header = req.headers.authorization ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Not signed in" });
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ error: "Session expired" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Not signed in" });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: "Not allowed" });
    }
    next();
  };
}
```

401 means "I do not know who you are". 403 means "I know who you are, and no". Keep them distinct; the frontend uses 401 to trigger a refresh and 403 to show a proper message.

## Using them on routes

```js
router.get("/clients", requireAuth, requireRole("distributor", "staff", "admin"), listClients);
router.patch("/settings", requireAuth, requireRole("admin"), updateSettings);
```

Roles decide which routes you can call. They do not decide which rows you can see. That second part is where most leaks happen, so the handler filters by the caller:

```js
async function listClients(req, res) {
  const filter = req.user.role === "distributor" ? { distributor: req.user.id } : {};
  const clients = await Client.find(filter).lean();
  res.json(clients);
}
```

A distributor never gets a query that could return someone else's clients, no matter what they put in the URL.

## Refreshing

```js
router.post("/auth/refresh", async (req, res) => {
  const raw = req.cookies.refresh;
  if (!raw) return res.status(401).json({ error: "Not signed in" });
  const tokenHash = crypto.createHash("sha256").update(raw).digest("hex");
  const stored = await RefreshToken.findOne({ tokenHash, expiresAt: { $gt: new Date() } });
  if (!stored) return res.status(401).json({ error: "Session expired" });

  const user = await User.findById(stored.user);
  const accessToken = jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_TTL,
  });
  res.json({ accessToken });
});
```

Logout deletes the stored refresh token and clears the cookie. "Sign out everywhere" deletes all of the user's refresh tokens. Both are one query because the tokens live in the database.

## A permissions table beats scattered ifs

Once you have more than three roles or more than ten routes, replace the role lists with a single object you can review:

```js
const PERMISSIONS = {
  "clients:read": ["distributor", "staff", "admin"],
  "clients:write": ["staff", "admin"],
  "settings:write": ["admin"],
};

export const can = (action) => requireRole(...PERMISSIONS[action]);
// router.patch("/settings", requireAuth, can("settings:write"), updateSettings);
```

When compliance asks "who can edit disclosures?", you read one file instead of grepping routes.

## Mistakes I made before this

- **Putting the role in the JWT and never re-checking it.** Demoting a user did nothing for 15 minutes. Acceptable for 15 minutes; not for 7 days, which is what my first version used.
- **Storing the access token in localStorage.** Any XSS could read it. Keep it in memory on the client and rely on the refresh cookie to get a new one on reload.
- **Returning the whole user document.** `passwordHash` went to the browser once. Use `.select("-passwordHash")` or a `toJSON` transform on the model.

## Sources

- jsonwebtoken on npm: [github.com/auth0/node-jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)
- OWASP session management cheat sheet: [cheatsheetseries.owasp.org](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- MDN on `Set-Cookie` attributes (`HttpOnly`, `SameSite`, `Secure`): [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie)
- HTTP 401 vs 403: [developer.mozilla.org/en-US/docs/Web/HTTP/Status/403](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/403)
