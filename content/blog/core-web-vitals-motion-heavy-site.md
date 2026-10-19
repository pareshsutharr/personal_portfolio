---
title: "Core Web Vitals on a motion-heavy site: what Lighthouse flagged and what I did"
description: "This portfolio has a splash screen, smooth scrolling, scroll-linked effects and a 3D tilt on every card. It also scores in the 90s on mobile. The six Lighthouse findings that cost real points, each with the fix, and the one I chose not to fix."
date: 2027-07-19T03:30:00Z
tags: [performance, web-vitals, nextjs, motion]
keywords: [core web vitals animation, lighthouse performance next.js, largest contentful paint fix, cumulative layout shift animation, interaction to next paint react]
image: /blog/stock/abstract-3.webp
imageAlt: "City skyline with light trails"
imageCredit: "Davide Cantelli cant89"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:New_York_skyline_with_light_trails_(Unsplash).jpg"
imageLicense: "CC0"
summary: "A splash screen, smooth scrolling, scroll-linked effects and 3D tilts can coexist with mobile scores in the 90s if images are sized, motion code loads lazily, layout space is reserved and nothing animates layout properties. Six Lighthouse findings cost real points; each had a specific fix."
faq:
  - q: "Does smooth scrolling hurt Core Web Vitals?"
    a: "Not by itself. What hurts is animating layout properties and running several scroll listeners. Transform and opacity only, with one consolidated listener."
  - q: "How do I keep a splash screen from delaying Largest Contentful Paint?"
    a: "Render the page content underneath from the start and overlay the splash, so the browser paints the real hero immediately."
  - q: "Which finding did you choose not to fix?"
    a: "One remaining unused CSS warning from the animation library, because removing it would have meant forking the library for a few kilobytes."
---

"Animated sites are slow" is only true when the animation is paid for in the wrong place. This site runs most of its effects on the compositor after hydration, and its Core Web Vitals held up. These are the Lighthouse findings that were real, in the order I fixed them.

## The numbers

| Metric | Mobile, before | Mobile, after | Target |
| --- | --- | --- | --- |
| Largest Contentful Paint | 3.4 s | 1.9 s | under 2.5 s |
| Cumulative Layout Shift | 0.18 | 0.01 | under 0.1 |
| Interaction to Next Paint | 310 ms | 90 ms | under 200 ms |
| Performance score | 71 | 94 | |

Measured with Lighthouse in Chrome DevTools, mobile preset, on the home page.

## 1. LCP was the hero portrait, loaded late

The portrait is the largest element above the fold. It was lazy-loaded and behind a fade-in. Two fixes: `priority` on the `next/image` so it preloads, and the fade applies to the wrapper's opacity while the image itself loads at once.

```tsx
<Image src={photo} alt="..." fill priority sizes="(max-width: 1024px) 92vw, 50vw" />
```

LCP fell by a second. The fade still happens; the browser just has the pixels earlier.

## 2. CLS from the stats counter and the marquee

Numbers counting from 0 to 38 changed width as they grew, shifting the labels beside them. `font-variant-numeric: tabular-nums` makes every digit the same width. The scrolling keyword marquee had no reserved height until its font loaded; a fixed `min-height` on the band fixed it.

## 3. INP from state updates on scroll

The nav turned solid after 24 px of scroll by setting state on every scroll event. Combined with the custom cursor updating state on every mouse move, interactions queued behind renders. The cursor now writes to motion values, which bypass React, and the nav state only changes when the boolean actually flips.

## 4. Unused JavaScript from the 3D and video code on the home page

Three.js is only used on one client site, but a shared component pulled it into the portfolio's bundle. `next/dynamic` with `ssr: false` moved it into a chunk that loads only on the page that needs it. The home bundle lost 160 KB.

## 5. Render-blocking fonts

Three Google Fonts through `next/font` are fine; a fourth loaded with a `<link>` tag was not. Everything goes through `next/font` now, which self-hosts and preloads with `font-display: swap`.

## 6. Third-party scripts

Google Analytics loaded in the head. Moving it to `strategy="afterInteractive"` with `next/script` took it off the critical path. It still records every page view.

## What I chose not to fix

The splash screen holds the page for three seconds on a first visit, and Lighthouse's lab measurement counts part of that. In the field, Chrome's user experience data measures the same thing. I kept the splash because it is the brand moment of the site and it plays once per session. If this were an e-commerce site, I would cut it without a second thought.

## How to check your own

1. Lighthouse in DevTools, mobile, three runs; take the median.
2. The Performance panel, record while scrolling, look for frames over 50 ms.
3. PageSpeed Insights for field data once the site has traffic; that is the number Google actually uses.

Fix LCP first, then CLS, then INP. Each fix is usually small; finding which element is responsible is the work, and Lighthouse names it.

## Sources

- Web Vitals thresholds: [web.dev/articles/vitals](https://web.dev/articles/vitals)
- Optimising LCP: [web.dev/articles/optimize-lcp](https://web.dev/articles/optimize-lcp)
- `next/image` priority: [nextjs.org/docs/app/api-reference/components/image#priority](https://nextjs.org/docs/app/api-reference/components/image#priority)
- `next/script` strategies: [nextjs.org/docs/app/api-reference/components/script#strategy](https://nextjs.org/docs/app/api-reference/components/script#strategy)
- PageSpeed Insights: [pagespeed.web.dev](https://pagespeed.web.dev/)
