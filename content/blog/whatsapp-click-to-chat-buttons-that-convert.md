---
title: "WhatsApp enquiry buttons that actually convert: wa.me, prefilled text, and knowing where they came from"
description: "On Bhaavya Ecopack, more enquiries arrive on WhatsApp than through the form. The button is one link. What makes it work is the prefilled message, the product it mentions, and a way to tell which page it was clicked on."
date: 2027-04-12T03:30:00Z
tags: [whatsapp, marketing, nextjs, analytics]
keywords: [whatsapp click to chat website, wa.me link prefilled message, whatsapp button next.js, track whatsapp clicks google analytics, b2b website enquiry whatsapp india]
project: bhavvya-ecopack
image: /blog/stock/chat-2.webp
imageAlt: "Group of people texting on smartphones"
imageCredit: "Tomwsulcer"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Young_people_texting_on_smartphones_using_thumbs.JPG"
imageLicense: "CC0"
summary: "A wa.me link with a prefilled message that names the product and the page it came from turns a WhatsApp button into a tracked enquiry channel. More enquiries arrive this way than through the form on a manufacturing site, and the prefilled text is what makes them useful."
faq:
  - q: "How do I make a WhatsApp link with a prefilled message?"
    a: "https://wa.me/<number>?text=<URL-encoded message>. Include the product name and the page so the reply has context."
  - q: "How do I know which page a WhatsApp enquiry came from?"
    a: "Put a short page reference in the prefilled text and record the click with your analytics before the link opens."
  - q: "Where should the button go?"
    a: "Fixed in a corner on mobile and next to each product's call to action on desktop, with the product-specific message on the product pages."
---

For a B2B manufacturer in Gujarat, WhatsApp is where business happens. Bhaavya Ecopack's site has a contact form, and it gets used, but the WhatsApp button next to every product gets used more. The whole feature is a link. The details are what turn a tap into a conversation the sales team can act on.

## The link

```
https://wa.me/919876543210?text=Hello%2C%20I%27m%20interested%20in...
```

`wa.me` opens WhatsApp on a phone and WhatsApp Web on a desktop, with the number and a prefilled message. The number is international format with no plus, spaces or dashes.

## Prefill with context

A blank chat starts with "Hi" and a sales rep asking what the person wants. A prefilled message that names the product and the page skips that round-trip:

```tsx
export function WhatsAppButton({ product, path }: { product?: string; path: string }) {
  const text = product
    ? `Hello, I am interested in ${product}. Could you share pricing and MOQ? (from ${path})`
    : `Hello, I would like a quote for corrugated packaging. (from ${path})`;
  const href = `https://wa.me/${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" data-wa-product={product ?? "general"}>
      Enquire on WhatsApp
    </a>
  );
}
```

The `(from /products/5-ply-export-box)` tail does two jobs. The sales team sees which page the person was on. And the page path survives into the chat even when the person deletes the rest of the message and types their own.

Keep the message short. Long prefilled text looks like a bot and people delete it.

## Know what was clicked

An outbound link to WhatsApp leaves the site, so the analytics you have on the form do not apply. Fire an event on click:

```tsx
onClick={() => {
  window.gtag?.("event", "whatsapp_click", { product: product ?? "general", page_path: path });
}}
```

In Google Analytics 4, mark `whatsapp_click` as a key event. After a month, the product pages with the most WhatsApp clicks told the client which products to put on the home page. That data did not exist before.

## Where the button lives

- **Product pages**: next to the price or specification table, with the product name prefilled.
- **A floating button** on mobile only, bottom-right, generic message. On desktop it was in the way and rarely used; the header link covers it.
- **The quote form's confirmation**: after submitting the form, a "Or continue on WhatsApp" link with the reference number prefilled. People who want a fast answer take it.

## Hours and expectations

The button says "Usually replies within an hour" during office hours and "Replies next working day" outside them, based on the visitor's clock in `Asia/Kolkata`. Setting the expectation stopped the repeat messages at 11 pm.

```ts
const hourIST = Number(new Intl.DateTimeFormat("en-IN", { hour: "numeric", hour12: false, timeZone: "Asia/Kolkata" }).format(new Date()));
const open = hourIST >= 9 && hourIST < 19;
```

## Things to avoid

- **WhatsApp widgets that load a third-party script** on every page. They add 100 to 300 KB and a cookie banner's worth of trackers for a link you can write yourself.
- **Personal numbers.** Use a WhatsApp Business number the company owns, so the conversation history stays when a rep leaves.
- **Prefilled marketing copy.** "Hello! I'd love to learn more about your amazing products!" reads as fake. Plain and specific wins.

## Sources

- WhatsApp click to chat documentation: [faq.whatsapp.com/5913398998672934](https://faq.whatsapp.com/5913398998672934)
- GA4 key events: [support.google.com/analytics/answer/9267568](https://support.google.com/analytics/answer/9267568)
- `encodeURIComponent`: [developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent)
