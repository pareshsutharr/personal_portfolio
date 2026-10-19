---
title: "A contact form that bots ignore: honeypot, fill time, and rate limits"
description: "No CAPTCHA, no third-party script, and almost no spam. The three checks on this site's contact form, why they work against the bots that actually visit small sites, and what to do with the one percent that gets through."
date: 2027-05-17T03:30:00Z
tags: [security, forms, nextjs, nodejs]
keywords: [contact form spam protection without captcha, honeypot field react, form fill time bot detection, rate limit contact form, server action spam protection]
image: /blog/stock/security-2.webp
imageAlt: "Rusted hasp and padlock on a red wooden door"
imageCredit: "Estormiz"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Padlock_Valimokatu_Oulu_20250307_03.jpg"
imageLicense: "CC0"
---

The contact form on this site has had spam protection since the day it went live, and in that time it has forwarded three spam messages. It has never shown a CAPTCHA. The bots that hit small business sites are not sophisticated; they fill every field, submit instantly, and come back from the same address. Three cheap checks catch nearly all of them.

## 1. Honeypot: a field only bots fill

An extra text input that people cannot see and bots do. If it has a value, the submission is spam.

```tsx
<div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
  <label htmlFor="contact-website">Website</label>
  <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" defaultValue="" />
</div>
```

Off-screen, not `display: none`; some bots skip hidden fields. `tabIndex={-1}` keeps keyboard users from landing in it. `aria-hidden` keeps screen readers out. Name it something a bot would want to fill, like `website`, not `honeypot`.

On the server:

```ts
if (input.website) return ok(null, "Thanks, your message is in."); // say nothing to the bot
```

Respond with success. A rejected submission tells a bot to try differently; a fake success tells it nothing.

## 2. Fill time: humans take longer than 3 seconds

A hidden field holds the time the form was rendered. If the submission arrives less than three seconds later, no human typed it.

```tsx
const [startedAt] = useState(() => Date.now());
<input type="hidden" name="started_at" value={startedAt} />
```

```ts
if (input.started_at && Date.now() - input.started_at < 3000) return ok(null, "Thanks, your message is in.");
```

Three seconds is conservative. Real submissions on this site take over forty on average; the fastest genuine one I have seen took nine.

## 3. Rate limits: per address and per email

Five submissions an hour from one IP, five a day from one email address. The counters are the messages table itself, so there is nothing extra to run:

```ts
const ipHash = sha256(`${ip}:${process.env.SALT}`).slice(0, 32);
const [{ count: byIp }, { count: byEmail }] = await Promise.all([
  db.from("contact_messages").select("id", { count: "exact", head: true }).eq("ip_hash", ipHash).gte("created_at", hourAgo),
  db.from("contact_messages").select("id", { count: "exact", head: true }).eq("email", email).gte("created_at", dayAgo),
]);
if ((byIp ?? 0) >= 5 || (byEmail ?? 0) >= 5) return fail("Too many messages in a short time. Please email me directly.");
```

Store a salted hash of the IP, not the IP. You need it for counting, not for identifying anyone, and a hash is all the counting needs.

## Validation is also spam protection

A message shorter than 20 characters is not a project enquiry. An email that does not parse is not reachable. Zod on the server rejects both before anything is stored, and the client mirrors the rules so people see errors as they type rather than after submitting.

```ts
message: z.string().trim().min(20, "Tell me a little more").max(4000),
email: z.string().trim().pipe(z.email("Enter a valid email")),
```

## What gets through

The three that got through were typed by people, selling link placements. No automated check stops a human. The inbox has a Spam status for exactly this; marking one takes a click and feeds the priority sorting, nothing more. That is proportionate for three messages a year.

## When you do need a CAPTCHA

If a form gives something away, like account creation, free credits or a coupon, humans will be paid to fill it, and these checks will not hold. That is when Turnstile or hCaptcha earns its place. A contact form does not give anything away; it gives you a message to read.

## Sources

- OWASP on honeypot fields and bot mitigation: [cheatsheetseries.owasp.org/cheatsheets/Forms_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Forms_Cheat_Sheet.html)
- Zod: [zod.dev](https://zod.dev/)
- Next.js server actions: [nextjs.org/docs/app/getting-started/updating-data](https://nextjs.org/docs/app/getting-started/updating-data)
- Cloudflare Turnstile, for when you do need a challenge: [developers.cloudflare.com/turnstile](https://developers.cloudflare.com/turnstile/)
