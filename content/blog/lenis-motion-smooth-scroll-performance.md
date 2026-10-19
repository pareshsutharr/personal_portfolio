---
title: "Smooth scrolling with Lenis and Motion without wrecking performance"
description: "This site uses Lenis for inertia scrolling and Motion for scroll-linked effects. Here is how the two fit together, what I measured, and the three rules that keep it at 60 fps on a mid-range phone."
date: 2026-12-21T03:30:00Z
tags: [react, motion, lenis, performance, nextjs]
keywords: [lenis react smooth scroll, lenis next.js, motion useScroll performance, scroll animation performance react, framer motion scroll linked]
image: /blog/stock/speed-3.webp
imageAlt: "Car speedometer dial"
imageCredit: "www.Pixel.la Free Stock Photos"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Car-vehicle-measure-fast_(23698208123).jpg"
imageLicense: "CC0"
---

Smooth scrolling libraries have a reputation for making sites feel heavy. Most of that comes from the old approach, where the library hijacked scrolling and moved the whole page with transforms. Lenis does not do that. It keeps native scrolling and smooths the wheel and touch input, so everything that reads the scroll position, including Motion's `useScroll` and the browser's own `IntersectionObserver`, keeps working.

## Setup in Next.js

One client component, mounted once in the layout:

```tsx
"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { useReducedMotion } from "motion/react";

export function SmoothScroll() {
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const lenis = new Lenis({ autoRaf: true, lerp: 0.09, anchors: { offset: -96 } });
    return () => lenis.destroy();
  }, [reduce]);
  return null;
}
```

Two details. `anchors` makes in-page `#links` scroll smoothly with an offset for a fixed header. And turn off CSS `scroll-behavior: smooth` on `html` while Lenis is active, or anchor jumps get eased twice:

```css
html.lenis { scroll-behavior: auto; }
```

## Scroll-linked effects with Motion

`useScroll` with a target element gives you a 0 to 1 progress value as that element moves through the viewport. Map it with `useTransform` and put the result straight into `style`. No React re-renders, no state.

```tsx
const ref = useRef<HTMLDivElement>(null);
const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
const y = useTransform(scrollYProgress, [0, 1], [-48, 48]);
return <motion.div ref={ref} style={{ y }}>{children}</motion.div>;
```

Because Lenis uses native scroll, `scrollYProgress` updates exactly as it would without Lenis. Nothing special is needed to make the two work together.

## The three rules that kept it fast

**1. Animate only `transform` and `opacity`.** Both are handled by the compositor, so they do not trigger layout or paint. The hero on this site moves up and fades as you scroll; the project cards tilt; the marquee slides. All transforms. The moment I animated `height` on one section, the frame time doubled on a phone.

**2. Never set React state from a scroll handler.** A `useMotionValue` updates the DOM directly. `useState` in `useMotionValueEvent` runs the whole component on every scroll frame. I made this mistake with a nav that turns solid after 24 px; the fix was to keep that single boolean in state, since it changes once, but never the raw scroll position.

**3. Measure on a real phone.** DevTools' CPU throttling at 4x is a decent proxy. Record a Performance trace while scrolling the whole page and look for long frames. On this site the only offender was a scroll-velocity marquee rendering four copies of a long string; cutting it to what fits the viewport fixed it.

## Things that break and how to fix them

- **Fixed elements inside a transformed parent.** A `transform` on an ancestor turns `position: fixed` into something like `absolute`. Keep fixed overlays, like a cookie bar or a feedback button, outside any animated wrapper.
- **Scrollable areas inside the page.** A modal with its own scroll fights Lenis. Add `data-lenis-prevent` to that element.
- **Anchor links to a fixed header.** Covered above with `anchors.offset`.
- **Reduced motion.** Skip Lenis entirely, and give every scroll-linked `style` an `undefined` fallback, so the page is plain for people who asked for that.

## What it costs

Lenis is about 10 KB. Motion is already in the bundle for everything else. The scroll effects added no measurable Largest Contentful Paint time because they only attach after hydration. Interaction to Next Paint stayed under 100 ms on a Pixel 6a as long as rule two held.

## Sources

- Lenis documentation: [github.com/darkroomengineering/lenis](https://github.com/darkroomengineering/lenis)
- Motion scroll animations: [motion.dev/docs/react-scroll-animations](https://motion.dev/docs/react-scroll-animations)
- Which CSS properties trigger layout, paint or composite: [csstriggers.com](https://csstriggers.com/)
- Chrome DevTools Performance panel: [developer.chrome.com/docs/devtools/performance](https://developer.chrome.com/docs/devtools/performance)
