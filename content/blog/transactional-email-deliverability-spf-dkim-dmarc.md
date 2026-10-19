---
title: "Transactional email that reaches the inbox: SPF, DKIM, DMARC, and what to do with bounces"
description: "The first password-reset emails from the Growth Avenues portal landed in spam. Nothing was wrong with the code. The domain had no SPF record, no DKIM signature and no DMARC policy, so receiving servers had no reason to trust it. The three records, the sending setup, and bounce handling."
date: 2027-11-01T03:30:00Z
tags: [email, dns, nodejs, deliverability]
keywords: [spf dkim dmarc setup, transactional email deliverability, email going to spam fix, handle email bounces node, sending domain authentication]
project: growth-avenues
---

The Gmail-SMTP post was for email to yourself. This is for email to your users: account verification, password resets, order confirmations. The code for those is trivial. Whether they arrive is decided by DNS records on your domain and by how you handle the replies you never see.

## Send from a subdomain you control

Use a transactional provider, any of the established ones, and send from a dedicated subdomain like `mail.growthavenues.in`. If that subdomain's reputation is ever hurt, the main domain's email is unaffected. The provider gives you the records to add; the three that matter:

## SPF: who may send for this domain

A TXT record listing the servers allowed to send mail with your domain in the envelope:

```
mail.growthavenues.in  TXT  "v=spf1 include:_spf.yourprovider.com -all"
```

`-all` means "reject anything else". Keep it to one record; two SPF records on a domain is a failure, not a union.

## DKIM: a signature on every message

The provider signs each outgoing message with a private key and publishes the public key in DNS. Receivers verify the signature, which proves the message was not altered and came from the signer:

```
s1._domainkey.mail.growthavenues.in  CNAME  s1.domainkey.yourprovider.com
```

Providers usually give two selectors so they can rotate keys. Add both.

## DMARC: what to do when the checks fail, and tell me

```
_dmarc.mail.growthavenues.in  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@growthavenues.in; adkim=s; aspf=s"
```

Start with `p=none` for a week to receive reports without affecting delivery, then `quarantine`, then `reject` once the reports show only your mail. The `rua` address receives daily XML reports; a free DMARC report viewer turns them into something readable. The reports are how I learned a contractor's marketing tool was sending as the main domain.

## Check it before sending to anyone

```bash
dig +short TXT mail.growthavenues.in
dig +short TXT _dmarc.mail.growthavenues.in
```

Then send a message to a mail-tester service, which scores the message and lists what failed. A 10 out of 10 there is the point at which the password reset starts landing.

## In the code: the parts that affect deliverability

```js
await provider.send({
  from: { email: "no-reply@mail.growthavenues.in", name: "Growth Avenues" },
  to: user.email,
  subject: "Reset your Growth Avenues password",
  text: plainTextVersion,          // always include a text part
  html: htmlVersion,
  headers: { "List-Unsubscribe": "<mailto:unsubscribe@mail.growthavenues.in>" },
  tags: ["password-reset"],
});
```

A text part alongside the HTML, a from name people recognise, a subject that says what the mail is, and no tracking pixels on transactional mail. Image-only emails and link shorteners are what spam filters look for.

## Bounces and complaints

Mail you send to an address that does not exist bounces. Keep sending to it and your reputation drops for everyone. The provider reports bounces and spam complaints through a webhook; record them and stop:

```js
router.post("/webhooks/email", verifyProviderSignature, async (req, res) => {
  for (const ev of req.body.events) {
    if (ev.type === "bounce" && ev.bounceType === "hard") await User.updateOne({ email: ev.email }, { emailStatus: "bounced" });
    if (ev.type === "complaint") await User.updateOne({ email: ev.email }, { emailStatus: "complained" });
  }
  res.json({ ok: true });
});
```

Before any send: `if (user.emailStatus !== "ok") skip`. A soft bounce, like a full mailbox, is retried by the provider; only hard bounces and complaints are permanent.

## Verify the webhook

Anyone can POST to that URL. Providers sign webhook payloads; verify the signature with the shared secret before trusting a single event, or an attacker can mark your whole user base as bounced.

## Sources

- SPF record syntax: [datatracker.ietf.org/doc/html/rfc7208](https://datatracker.ietf.org/doc/html/rfc7208)
- DKIM: [datatracker.ietf.org/doc/html/rfc6376](https://datatracker.ietf.org/doc/html/rfc6376)
- DMARC overview and policy records: [dmarc.org/overview](https://dmarc.org/overview/)
- Google's sender guidelines, which most providers now mirror: [support.google.com/a/answer/81126](https://support.google.com/a/answer/81126)
- mail-tester: [mail-tester.com](https://www.mail-tester.com/)
