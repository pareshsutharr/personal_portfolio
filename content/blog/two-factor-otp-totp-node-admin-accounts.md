---
title: "Two-factor authentication for admin accounts: TOTP with an authenticator app, and SMS OTP for the people who need it"
description: "After the audit log and the password reset, the next question from a client was 'can we require a code to log in as admin'. Yes, and it is a day of work: TOTP with any authenticator app as the default, SMS OTP as the fallback for staff without smartphones, recovery codes, and the trust-this-device cookie that keeps it from being annoying."
date: 2028-04-03T03:30:00Z
tags: [security, auth, nodejs, totp, otp]
keywords: [totp two factor node.js, otpauth authenticator app express, sms otp login node, 2fa recovery codes, trusted device cookie 2fa]
project: growth-avenues-hrms
---

A password alone protects an HR admin account about as well as the weakest password any admin has ever reused. A second factor makes a leaked password insufficient. The HRMS requires it for every role that can see salaries, and the implementation is smaller than people expect.

## TOTP: the default

Time-based one-time passwords are what Google Authenticator, Authy and every password manager generate. There is no SMS cost and nothing to deliver. The server stores one secret per user and computes the same six digits the app does.

### Enrolment

```js
import { authenticator } from "otplib";
import QRCode from "qrcode";

router.post("/2fa/totp/setup", requireAuth, async (req, res) => {
  const secret = authenticator.generateSecret();                                 // base32
  await User.updateOne({ _id: req.user.id }, { "totp.pendingSecret": encrypt(secret) });
  const uri = authenticator.keyuri(req.user.email, "Growth Avenues HRMS", secret);
  res.json({ qr: await QRCode.toDataURL(uri), manual: secret });
});

router.post("/2fa/totp/confirm", requireAuth, validate(z.object({ code: z.string().length(6) })), async (req, res) => {
  const user = await User.findById(req.user.id);
  const secret = decrypt(user.totp.pendingSecret);
  if (!authenticator.check(req.validated.body.code, secret)) throw new HttpError(400, "That code did not match. Try the next one.");
  const recovery = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString("hex"));
  user.totp = { secret: encrypt(secret), enabledAt: new Date(), pendingSecret: null };
  user.recoveryCodes = await Promise.all(recovery.map((c) => argon2.hash(c)));
  await user.save();
  res.json({ ok: true, recoveryCodes: recovery });    // shown once, never again
});
```

The secret is not enabled until the person proves their app produces a matching code. Secrets are encrypted at rest with a key from the environment; a database dump alone should not yield working second factors. Recovery codes are hashed like passwords and shown exactly once.

### Login

Login becomes two steps. The password step issues a short-lived "pre-auth" token that can do one thing: submit a second factor.

```js
router.post("/auth/login", ...passwordChecks, async (req, res) => {
  // password verified, user loaded
  if (user.totp?.enabledAt || user.phoneOtp?.enabledAt) {
    const preAuth = jwt.sign({ sub: user.id, stage: "2fa" }, process.env.JWT_SECRET, { expiresIn: "5m" });
    return res.json({ next: "2fa", preAuth, methods: availableMethods(user) });
  }
  return issueSession(res, user);
});

router.post("/auth/2fa", requirePreAuth, rateLimit({ windowMs: 10 * 60 * 1000, max: 6 }), async (req, res) => {
  const user = await User.findById(req.preAuth.sub);
  const { code } = req.body;
  const ok =
    (user.totp?.enabledAt && authenticator.check(code, decrypt(user.totp.secret)) && await notReplayed(user, code)) ||
    (await consumeRecoveryCode(user, code));
  if (!ok) throw new HttpError(401, "Invalid code");
  if (req.body.trustDevice) setTrustedDeviceCookie(res, user);
  return issueSession(res, user);
});
```

Six attempts per ten minutes against a six-digit code makes guessing hopeless. `notReplayed` stores the last accepted code's time step so the same code cannot be used twice inside its 30-second window.

## SMS OTP: the fallback

Some field staff do not have a smartphone with an authenticator. For them the second factor is a six-digit code sent by SMS, valid for five minutes:

```js
async function sendSmsOtp(user) {
  const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await Otp.create({ user: user._id, codeHash: sha256(code), expiresAt: new Date(Date.now() + 5 * 60_000), attempts: 0 });
  await sms.send(user.phone, `${code} is your Growth Avenues login code. Valid 5 minutes. Do not share it.`);
}
```

Stored hashed, three verification attempts per code, one active code per user, and a resend limit of three per hour. SMS is weaker than TOTP, since SIM swap attacks exist, and the admin role that can edit salaries is TOTP-only; the policy is per role.

## Trusted devices

Entering a code on every login is how people start asking to turn 2FA off. After a successful second factor with "trust this device" ticked, a cookie holds a random token that is stored hashed against the user with a 30-day expiry. On login from that device, the second step is skipped. The cookie is `HttpOnly`, `Secure`, `SameSite=Lax`, and all trusted devices are listed in the profile with a "revoke" button, and revoked on password change.

## Recovery

Lost phone and no recovery codes is a support ticket, by design. An admin with a higher role can reset a user's second factor after verifying identity out of band, and the audit log records who did it. No self-service bypass exists, because every self-service bypass is a bypass.

## Sources

- TOTP, RFC 6238: [datatracker.ietf.org/doc/html/rfc6238](https://datatracker.ietf.org/doc/html/rfc6238)
- otplib: [github.com/yeojz/otplib](https://github.com/yeojz/otplib)
- Key URI format for authenticator apps: [github.com/google/google-authenticator/wiki/Key-Uri-Format](https://github.com/google/google-authenticator/wiki/Key-Uri-Format)
- OWASP multifactor authentication cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Multifactor_Authentication_Cheat_Sheet.html)
- NIST on SMS as a factor: [pages.nist.gov/800-63-3/sp800-63b.html#pstnOOB](https://pages.nist.gov/800-63-3/sp800-63b.html#pstnOOB)
