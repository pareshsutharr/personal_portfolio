---
title: "Getting this site to a Lighthouse 100 on mobile: the eight changes that moved the score, and the two that did nothing"
description: "A performance score is a summary of a handful of measurements, and only some things move them. The audit on this site went from 61 to 100 on a simulated phone over two weeks. Each change, what it moved, by how much, and the two popular optimisations that measurably did nothing here."
date: 2028-06-05T03:30:00Z
tags: [performance, lighthouse, nextjs, core-web-vitals, frontend]
keywords: [lighthouse 100 next.js, improve largest contentful paint next.js, core web vitals portfolio, reduce javascript bundle next.js, lighthouse mobile score]
project: portfolio
image: /blog/stock/abstract-3.webp
imageAlt: "City skyline with light trails"
imageCredit: "Davide Cantelli cant89"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:New_York_skyline_with_light_trails_(Unsplash).jpg"
imageLicense: "CC0"
summary: "Eight changes took this site from 61 to 100 on mobile: optimised images, priority on the LCP image, self-hosted fonts, reserved space for images and embeds, lazy-loaded motion code, YouTube facades, a non-blocking splash screen and removing third-party scripts. Minifying further and swapping scroll libraries did nothing."
faq:
  - q: "What moved Largest Contentful Paint the most?"
    a: "Running images through a pipeline and giving the hero image fetchpriority high. Everything else combined mattered less."
  - q: "How do YouTube embeds hurt the score?"
    a: "Each iframe loads about 500 KB of JavaScript before anyone presses play. Show a thumbnail with a play button and load the iframe on click."
  - q: "How should I measure changes without chasing noise?"
    a: "Three Lighthouse runs per change in a private window with mobile throttling, take the median, and treat moves under three points as noise."
---

The first mobile audit of this site, after the animations and backdrops went in, scored 61. Two weeks of changes, each measured on its own, brought it to 100. The useful part is not the number; it is which changes mattered, because they are the same ones that matter on client sites.

## Starting point

| Metric | Before |
|---|---|
| Performance | 61 |
| Largest Contentful Paint | 6.8 s |
| Total Blocking Time | 890 ms |
| Cumulative Layout Shift | 0.21 |
| Speed Index | 5.1 s |

## The eight that moved it

**1. Images through the pipeline.** LCP 6.8 s to 2.9 s. The previous post. The single biggest change, by far.

**2. Priority on the LCP image.** The hero's backdrop is the largest element on the first screen. `fetchPriority="high"` and no `loading="lazy"` on that one image, lazy on everything else. LCP 2.9 s to 2.3 s.

**3. Fonts: self-hosted, two files, `font-display: swap`, preloaded.** Google Fonts was a third-party connection plus a stylesheet before any text could render. Two variable-font files in `public/fonts`, `@font-face` with `swap`, and a `<link rel="preload">` for the body font. Speed Index 5.1 s to 3.2 s and the "flash of invisible text" gone.

**4. Width and height on every image, and reserved space for the video embeds.** CLS 0.21 to 0.02. Layout shift was entirely images and iframes arriving without reserved space.

**5. Motion components loaded only when needed.** The scroll animation library and the cursor spotlight were in the initial bundle. Dynamic imports with `ssr: false` for the cursor effect, and the heavy scroll components only on the home page. First Load JS for the blog pages dropped from 210 KB to 96 KB. TBT 890 ms to 310 ms.

**6. The YouTube embeds became facades.** A thumbnail with a play button, and the real iframe only on click. Each YouTube iframe was 500 KB of JavaScript before anyone pressed play. TBT 310 ms to 120 ms.

**7. The splash screen does not block.** The logo assembly animation runs in CSS and Motion, but the page content is rendered underneath from the start rather than mounted after the animation. Lighthouse had been measuring LCP as the moment the splash finished. LCP 2.3 s to 1.9 s.

**8. Third-party scripts removed.** An analytics snippet and a chat widget from an earlier experiment. Both were render-blocking. TBT 120 ms to 40 ms. The analytics post later in this series covers the replacement.

## The two that did nothing

**Minifying inline SVGs and CSS further.** Saved 6 KB. No metric moved. The build already does this.

**Switching to a lighter smooth-scroll library.** The library size was not the problem; the number of scroll listeners was, and that was fixed by consolidating them, which happened as part of change 5.

## After

| Metric | After |
|---|---|
| Performance | 100 |
| LCP | 1.9 s |
| TBT | 40 ms |
| CLS | 0.02 |
| Speed Index | 1.6 s |

## How it was measured

Lighthouse in Chrome DevTools in a private window, mobile preset, throttling on, three runs per change, median taken. Lighthouse scores vary between runs by a few points; a change that moved the median by less than three was treated as noise. Field data from real visitors in Search Console's Core Web Vitals report is the measurement that counts for ranking; the lab score is the fast feedback loop to get there.

## What transfers to client sites

Images, fonts, reserved space, and third-party scripts are the four in every audit I run. Bundle splitting matters on app-like sites; facades matter on anything with embeds. The order above is roughly the order of return on effort.

## Sources

- Lighthouse performance scoring: [developer.chrome.com/docs/lighthouse/performance/performance-scoring](https://developer.chrome.com/docs/lighthouse/performance/performance-scoring)
- Optimise LCP: [web.dev/articles/optimize-lcp](https://web.dev/articles/optimize-lcp)
- `fetchpriority`: [web.dev/articles/fetch-priority](https://web.dev/articles/fetch-priority)
- Third-party facades: [web.dev/articles/embed-best-practices](https://web.dev/articles/embed-best-practices)
- Next.js font optimisation: [nextjs.org/docs/app/api-reference/components/font](https://nextjs.org/docs/app/api-reference/components/font)
- Search Console Core Web Vitals report: [support.google.com/webmasters/answer/9205520](https://support.google.com/webmasters/answer/9205520)
