---
title: "The feedback widget: shipping a small feature end to end in an afternoon"
description: "A floating button, a five-star rating, an optional note, an inbox entry and an email. The widget on this site took one afternoon because every decision was the boring one. The decisions, the code that matters, and the test that proved it before it shipped."
date: 2027-08-30T03:30:00Z
tags: [react, nextjs, product, forms]
keywords: [website feedback widget react, floating feedback button, server action form react, rating widget react, ship small feature fast]
image: /blog/stock/team-1.webp
imageAlt: "Man working at a laptop in an office"
imageCredit: "Bench Accounting benchaccounting"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Man_at_a_laptop_in_an_office_(Unsplash).jpg"
imageLicense: "CC0"
---

The bottom-right corner of this site has an ember button. Tap it and you get "How was this portfolio?", five stars, an optional note, optional name and email, and a Send button. I built it between lunch and dinner. Nothing about it is clever, which is why it took an afternoon rather than a week.

## The decisions

- **Reuse the inbox.** Feedback is stored as a contact message tagged "Feedback", so the admin already lists it and the email notification already fires. A new table would have meant a migration, a new admin page and a new notifier for the same outcome.
- **No new dependencies.** Motion for the open and close, a server action for the submit, the existing honeypot and rate limit.
- **Anonymous by default.** Name and email are optional. The inbox requires an email column, so anonymous entries get a placeholder address and the name "Anonymous visitor".
- **One shape of success.** After sending, the card shows a thank-you. No confetti.

## The server action

```ts
"use server";
const schema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  message: z.string().trim().max(1000).optional().or(z.literal("")),
  name: z.string().trim().max(80).optional().or(z.literal("")),
  email: z.string().trim().email().optional().or(z.literal("")),
  page: z.string().max(200).optional(),
  website: z.string().optional(),                 // honeypot
});

export async function submitFeedback(_prev, formData) {
  const parsed = parseInput(schema, Object.fromEntries(formData));
  if (!parsed.ok) return parsed.result;
  const input = parsed.data;
  if (input.website) return ok(null, "Thanks!");

  const ipHash = hashIp(await clientIp());
  if ((await countRecent(ipHash, "Feedback")) >= 3) return fail("Thanks, I already have your feedback.");

  const label = ["", "Not for me", "Could be better", "It's fine", "Liked it", "Loved it"][input.rating];
  await db.from("contact_messages").insert({
    name: input.name || "Anonymous visitor",
    email: input.email || "anonymous@feedback.local",
    subject: `Feedback · ${input.rating}/5 · ${label}`,
    message: input.message || "(no message, rating only)",
    project_type: "Feedback",
    source: input.page ?? null,
    priority: input.rating <= 2 ? "high" : "normal",
    ip_hash: ipHash,
  });
  void sendOwnerEmail({ subject: `Portfolio feedback: ${input.rating}/5 (${label})`, text: `...`, replyTo: input.email || null }).catch(() => {});
  return ok(null, "I read every one of these.");
}
```

Low ratings get high priority in the inbox. A one-star with a note is the most useful message the site can receive.

## The widget

A client component with `useActionState` for the submit, a `rating` in state, and five star buttons that behave like a radio group for screen readers:

```tsx
<div role="radiogroup" aria-label="Rating">
  {[1, 2, 3, 4, 5].map((n) => (
    <button key={n} type="button" role="radio" aria-checked={rating === n}
      aria-label={`${n} out of 5, ${LABELS[n]}`} onClick={() => setRating(n)}>
      <Star className={n <= (hover || rating) ? "fill-ember-500 text-ember-500" : "text-fg-700"} />
    </button>
  ))}
</div>
<input type="hidden" name="rating" value={rating} />
<input type="hidden" name="page" value={pathname} />
```

Send is disabled until a star is picked. Escape closes the card. The card has `data-lenis-prevent` so its own scrolling does not fight the page's smooth scroll.

## The test before shipping

I drove a headless Chrome through it: open the widget, click the fourth star, type a note, submit, read the thank-you text, then query the database for the newest row tagged Feedback. Twenty lines of script, run once. It caught that the submit button's disabled state was checking the wrong variable. That is the kind of bug a human tester finds on day three.

## What I would add, and when

Nothing, until a message asks for it. Screenshots, emoji reactions and a "was this page helpful" per post are all obvious extensions. The widget has one job: make it trivially easy to tell me something. It does that.

## Sources

- React `useActionState`: [react.dev/reference/react/useActionState](https://react.dev/reference/react/useActionState)
- WAI-ARIA radio group pattern: [w3.org/WAI/ARIA/apg/patterns/radio](https://www.w3.org/WAI/ARIA/apg/patterns/radio/)
- Next.js server actions: [nextjs.org/docs/app/getting-started/updating-data](https://nextjs.org/docs/app/getting-started/updating-data)
