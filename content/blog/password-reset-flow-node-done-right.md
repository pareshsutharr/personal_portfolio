---
title: "A password reset flow that is actually safe: tokens, hashing, expiry and the message that gives nothing away"
description: "Password reset is the back door to every account, and most tutorials leave it unlocked. The flow I ship in Express and Next.js: a random token the database never stores in plain form, a fifteen-minute expiry, single use, the same response whether the email exists or not, and sessions invalidated on success."
date: 2028-03-27T03:30:00Z
tags: [security, auth, nodejs, express, email]
keywords: [password reset flow node.js, secure password reset token, forgot password express implementation, password reset token hash database, account enumeration prevention]
project: growth-avenues
image: /blog/stock/fingerprint-1.webp
imageAlt: "Fingerprint scan illustration in blue"
imageCredit: "mikemacmarketing"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Fingerprint_Scanner.jpg"
imageLicense: "CC BY 2.0"
summary: "A safe reset emails a random token whose hash alone is stored, expires in fifteen minutes, works once through an atomic update, gives the same response whether or not the email exists, invalidates every session on success and notifies the account. Password rules are length plus a common-password blocklist."
faq:
  - q: "Why store only the hash of the reset token?"
    a: "If the database leaks, attackers get hashes that cannot be turned back into usable links. SHA-256 is fine here because the token is 256 random bits."
  - q: "Why respond the same way for unknown emails?"
    a: "A different message lets anyone discover which addresses have accounts. Say the link was sent if the address is registered, and keep timing similar."
  - q: "Why log out every session after a reset?"
    a: "The reset is often prompted by a stolen device, and the thief's existing session must die. Bumping a session version on the user does that."
---

I inherited a codebase once where "forgot password" emailed the user their current password in plain text. It had been live for two years. The replacement flow is below, and it is the one I now use everywhere, because the differences between a safe reset and an unsafe one are all small and all matter.

## The flow

1. Person submits their email on the forgot-password page.
2. Server responds "If that address is registered, we have sent a link", regardless of whether it is.
3. If it is, the server creates a random token, stores only its hash with an expiry, and emails the plain token in a link.
4. Person opens the link, enters a new password.
5. Server hashes the submitted token, looks it up, checks expiry and that it is unused, sets the password, marks the token used, and invalidates every existing session.

## Step 2 and 3: request

```js
router.post("/auth/forgot", rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyGenerator: (req) => req.body.email ?? req.ip }),
  validate(z.object({ email: z.string().email() })), async (req, res) => {
  const user = await User.findOne({ email: req.validated.body.email.toLowerCase() });
  if (user) {
    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    await PasswordReset.create({ user: user._id, tokenHash, expiresAt: new Date(Date.now() + 15 * 60 * 1000) });
    const url = `${process.env.APP_URL}/reset-password?token=${token}`;
    await sendEmail({ to: user.email, template: "password-reset", data: { name: user.name, url, minutes: 15 } });
  }
  res.json({ ok: true, message: "If that address is registered, we have sent a reset link." });
});
```

**Same response either way.** A different message for unknown emails lets anyone check which addresses have accounts. The timing should be similar too; a sleep to even it out is cheap.

**Only the hash is stored.** If the database leaks, the attacker has hashes of tokens, not tokens. SHA-256 is fine here, unlike for passwords, because the token is 256 bits of randomness and cannot be guessed.

**Rate limited by email and IP.** Five requests per fifteen minutes stops someone flooding a victim's inbox or probing.

## Step 5: reset

```js
router.post("/auth/reset", validate(z.object({ token: z.string().min(20), password: passwordSchema })), async (req, res) => {
  const { token, password } = req.validated.body;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const reset = await PasswordReset.findOneAndUpdate(
    { tokenHash, usedAt: null, expiresAt: { $gt: new Date() } },
    { usedAt: new Date() },
    { new: true }
  );
  if (!reset) throw new HttpError(400, "This link is invalid or has expired. Request a new one.");

  const user = await User.findById(reset.user);
  user.passwordHash = await argon2.hash(password);
  user.sessionVersion += 1;                        // every existing session becomes invalid
  await user.save();
  await PasswordReset.updateMany({ user: user._id, usedAt: null }, { usedAt: new Date() });  // kill other outstanding links
  await audit({ action: "password_reset", actor: { id: user._id }, request: req });
  await sendEmail({ to: user.email, template: "password-changed", data: { name: user.name, when: new Date() } });
  res.json({ ok: true });
});
```

**Atomic single use.** The `findOneAndUpdate` from `usedAt: null` to a timestamp means two submissions of the same token cannot both succeed.

**Sessions invalidated.** If the reset was prompted by a stolen phone, the thief's logged-in session must die. Every session carries the user's `sessionVersion`; bumping it logs out everywhere. The sessions post covers the mechanism.

**A notification goes out.** "Your password was changed at 10:42" to the account's email. If the real owner did not do it, this is how they find out.

## The link page

The reset page loads the token from the URL into a hidden field and never writes it to logs, analytics or the referrer. The form submits to the reset endpoint; the token is not validated on page load, because that would let anyone with a link check whether it is live without using it.

## Password rules

```js
const passwordSchema = z.string().min(12).max(128).refine((p) => !commonPasswords.has(p.toLowerCase()), "That password is too common");
```

Length and a blocklist of the ten thousand most common passwords. No complexity rules; they produce `Password1!` and nothing safer. The password is compared against the person's email and name too, so `rahul@example.com` cannot set `rahul12345678`.

## Clean-up

A TTL index on `PasswordReset.expiresAt` removes expired tokens automatically. Used ones are kept a month for the audit trail, then removed by the same index with a longer `expireAfterSeconds` on `usedAt`.

## Sources

- OWASP forgot password cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Forgot_Password_Cheat_Sheet.html)
- OWASP authentication cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- NIST password guidance, section 5.1.1: [pages.nist.gov/800-63-3/sp800-63b.html](https://pages.nist.gov/800-63-3/sp800-63b.html)
- Node `crypto.randomBytes`: [nodejs.org/api/crypto.html#cryptorandombytessize-callback](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback)
- argon2 for Node: [github.com/ranisalt/node-argon2](https://github.com/ranisalt/node-argon2)
