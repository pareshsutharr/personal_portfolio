---
title: "Email from a side project: Gmail SMTP with an app password, honestly"
description: "For a contact form that sends you ten emails a week, a transactional email service is overkill. Gmail SMTP with an app password works, with limits you should know before you rely on it. Setup, the Node code, and when to move off it."
date: 2027-05-10T03:30:00Z
tags: [email, nodejs, nodemailer, gmail]
keywords: [nodemailer gmail app password, send email node.js gmail smtp, gmail smtp limits, contact form email node, nodemailer vs resend]
image: /blog/stock/security-1.webp
imageAlt: "Padlock on a wooden door"
imageCredit: "Quim Gil"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Abloy_padlock_in_Oulu.jpg"
imageLicense: "CC0"
---

This site's contact form and feedback widget email me through Gmail. Not through a transactional email API with templates and dashboards, through SMTP with an app password, the same way an email client would. For a personal site that sends a few messages a day to one inbox, that is the right amount of infrastructure.

## When it is fine, and when it is not

Fine: notifications to yourself, low volume, nothing time-critical. Gmail's sending limit for a normal account is 500 messages a day, and far fewer if they look like bulk.

Not fine: email to your users. Password resets, receipts, anything where deliverability matters. Gmail's reputation on your behalf is not something you control, and the first time a reset email lands in spam you will wish you had a dedicated sender. For that, use a transactional service and a domain you own.

## Setup

1. Turn on two-step verification on the Google account. App passwords are only available with it.
2. Google Account, Security, App passwords. Create one named for the project. Google shows a sixteen-character password once.
3. Put it in the environment. Spaces in the password are optional; Google accepts it with or without.

```
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=abcdefghijklmnop
CONTACT_NOTIFY_EMAIL=you@gmail.com
```

## The code

```ts
import { createTransport } from "nodemailer";

export async function sendOwnerEmail(input: { subject: string; text: string; replyTo?: string | null }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return false;                  // site still works without email

  const transporter = createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user, pass } });
  await transporter.sendMail({
    from: `"Portfolio" <${user}>`,
    to: process.env.CONTACT_NOTIFY_EMAIL ?? user,
    replyTo: input.replyTo ?? undefined,
    subject: input.subject,
    text: input.text,
  });
  return true;
}
```

Two decisions in there. The function returns `false` instead of throwing when email is not configured, so a fresh clone of the project runs without it. And `replyTo` is the visitor's address, so pressing reply in Gmail answers them, not you.

Call it after the message is saved, and do not make the visitor wait for it:

```ts
const { error } = await db.insert(message);
if (error) return fail("Could not send right now.");
void sendOwnerEmail({...}).catch(() => {});       // saved already; email is best-effort
return ok("Thanks, I read every message.");
```

The message is in the database whether or not Gmail is reachable. The email is a notification, not the record.

## Verify it from the server

```bash
node -e '
const { createTransport } = require("nodemailer");
createTransport({ host: "smtp.gmail.com", port: 465, secure: true, auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } })
  .verify().then(() => console.log("ok")).catch(e => console.log(e.message));'
```

"Username and Password not accepted" means the app password belongs to a different account than `GMAIL_USER`, or two-step verification was turned off, which revokes all app passwords.

## Things that go wrong

- **Port 465 blocked** on some hosts. Use 587 with `secure: false`; Nodemailer upgrades to TLS with STARTTLS.
- **The `from` must be the Gmail account.** Gmail rewrites any other address, and some setups reject it.
- **Rotate the password if it ever leaves your machine.** Including pasting it into a chat. App passwords are revoked in one click and recreated in another.

## Moving off it

When the project starts sending to other people, switch to a transactional provider and keep the function signature. `sendOwnerEmail` becomes a call to their SDK and nothing else in the codebase changes. That is the whole reason to wrap it.

## Sources

- Google, sign in with app passwords: [support.google.com/accounts/answer/185833](https://support.google.com/accounts/answer/185833)
- Gmail sending limits: [support.google.com/a/answer/166852](https://support.google.com/a/answer/166852)
- Nodemailer SMTP transport: [nodemailer.com/smtp](https://nodemailer.com/smtp/)
- Nodemailer with Gmail: [nodemailer.com/usage/using-gmail](https://nodemailer.com/usage/using-gmail/)
