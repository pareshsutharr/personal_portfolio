---
title: "Stopping login brute force without locking out your own users: progressive delays, per-account counters and a notification"
description: "The rate limiting post throttled by IP. A credential-stuffing attempt against the client portal came from eight hundred IPs and hit each account a few times, under every IP limit. What stopped it: counters per account, delays that grow with failures, a soft lock that the real user can clear by email, and an alert when the failure rate across all accounts jumps."
date: 2028-07-31T03:30:00Z
tags: [security, auth, nodejs, express, rate-limiting]
keywords: [login brute force protection node.js, account lockout vs progressive delay, credential stuffing defense express, failed login counter redis, login security alert]
project: growth-avenues
image: /blog/stock/security-2.webp
imageAlt: "Rusted hasp and padlock on a red wooden door"
imageCredit: "Estormiz"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Padlock_Valimokatu_Oulu_20250307_03.jpg"
imageLicense: "CC0"
summary: "Count failures per account, not just per IP, grow the delay with each failure, soft-lock after ten with an unlock email the real user can click, alert when the global failure rate jumps, and check passwords against the Have I Been Pwned range API. No CAPTCHA was needed."
faq:
  - q: "Why is per-IP rate limiting not enough against credential stuffing?"
    a: "Attackers rotate through hundreds of IPs and try each account a few times, staying under every IP limit. A per-account counter sees all of them."
  - q: "Why not hard-lock the account after failed attempts?"
    a: "Anyone could lock you out of your own account by failing ten times. A soft lock that the owner clears by email and that expires avoids that."
  - q: "How does the leaked-password check work without sending the password?"
    a: "Send the first five characters of the SHA-1 hash to the range API and compare the returned suffixes locally. The full hash never leaves the server."
---

Per-IP rate limiting is the first line and it is not enough. The attempt that got through it used a list of leaked email and password pairs, tried each once or twice, and rotated IPs on every request. Every IP stayed under the limit. Four accounts with reused passwords were accessed before the pattern was noticed. The defences below went in that week.

## 1. Count failures per account, not just per IP

```js
async function recordFailure(email) {
  const key = `login:fail:${email.toLowerCase()}`;
  const n = await redis.incr(key);
  if (n === 1) await redis.expire(key, 60 * 60);          // window: 1 hour, sliding from first failure
  return n;
}
async function clearFailures(email) { await redis.del(`login:fail:${email.toLowerCase()}`); }
```

An attacker with a thousand IPs still hits the same account counter. The key is the email as submitted, lowercased, whether or not the account exists, so probing for valid emails is counted too.

## 2. Delay grows with failures

```js
const delayFor = (n) => Math.min(30_000, n < 3 ? 0 : 2 ** (n - 3) * 1000);   // 0, 0, 0, 1s, 2s, 4s, 8s … 30s
router.post("/auth/login", ipLimiter, validate(loginSchema), async (req, res) => {
  const { email, password } = req.validated.body;
  const failures = Number(await redis.get(`login:fail:${email.toLowerCase()}`)) || 0;
  if (failures >= 10) throw new HttpError(423, "Too many attempts. Check your email for a link to unlock your account.");
  await sleep(delayFor(failures));
  const user = await User.findOne({ email: email.toLowerCase() });
  const ok = user && await argon2.verify(user.passwordHash, password);
  if (!ok) {
    const n = await recordFailure(email);
    if (n === 10 && user) await sendUnlockEmail(user);
    await audit({ action: "login_failed", actor: { id: user?._id }, request: req });
    throw new HttpError(401, "Email or password is incorrect");
  }
  await clearFailures(email);
  // ... 2FA / session as in earlier posts
});
```

Three free attempts, then each failure doubles the wait. A person who mistypes twice notices nothing. A script trying two hundred passwords against one account spends most of an hour waiting, and after ten it is told to stop.

Note the delay applies before the password check, and the same generic error is returned whether the email exists or not, so neither timing nor wording leaks which accounts are real.

## 3. A soft lock the real user can clear

A hard lockout is a denial-of-service tool: anyone can lock you out of your own account by failing ten times. So the lock is soft and self-clearing. At ten failures the real account holder gets an email: "Someone tried to sign in to your account ten times. If this was you, click here to unlock and sign in. If not, you may want to change your password." The link clears the counter and leads to login. The lock also expires with the hour window.

## 4. An alert on the global failure rate

Individual accounts are protected above. The thing that catches a distributed attack early is the aggregate:

```js
// every minute, from the worker
const failures = await redis.get("login:fail:total:" + currentMinute());
if (failures > baseline * 5) notify("Login failures spiking: " + failures + "/min");
```

A counter per minute across all accounts, compared to the usual rate. The credential-stuffing run that started this showed as a jump from about 3 failures a minute to 180. With this alert it would have been noticed in the second minute rather than the next morning.

## 5. Leaked-password check on login and on set

When a login succeeds, the password's SHA-1 prefix is checked against the Have I Been Pwned range API, which never receives the full hash. If it appears in a breach, the person is asked to change it at next login. The same check runs when any password is set. Of the four compromised accounts, all four passwords were in the breach corpus. This one check would have kept them out.

```js
const sha1 = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
const res = await fetch(`https://api.pwnedpasswords.com/range/${sha1.slice(0, 5)}`, { headers: { "Add-Padding": "true" } });
const found = (await res.text()).split("\n").some((line) => line.startsWith(sha1.slice(5)));
```

## 6. Second factor for anyone who can see money

Covered in the 2FA post. After this incident the client made TOTP mandatory for every role with access to client holdings, which removed the question of whether a stolen password alone was enough.

## What this does not do

CAPTCHAs are not in the flow. They were tried, they annoyed everyone, and the measures above made them unnecessary at this scale. For a consumer product with millions of accounts, the calculus is different and a risk-based challenge after a few failures is reasonable.

## Sources

- OWASP credential stuffing prevention: [cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Credential_Stuffing_Prevention_Cheat_Sheet.html)
- OWASP on account lockout and its DoS risk: [owasp.org/www-community/controls/Blocking_Brute_Force_Attacks](https://owasp.org/www-community/controls/Blocking_Brute_Force_Attacks)
- Have I Been Pwned range API: [haveibeenpwned.com/API/v3#PwnedPasswords](https://haveibeenpwned.com/API/v3#PwnedPasswords)
- NIST 800-63B on throttling: [pages.nist.gov/800-63-3/sp800-63b.html#throttle](https://pages.nist.gov/800-63-3/sp800-63b.html#throttle)
