---
title: "A splash screen in Next.js that hands off to the nav logo"
description: "First visit: black screen, logo assembles in the centre, then glides into the exact spot of the nav logo while the site loads underneath. Measured live, so it lands correctly on any screen. Once per session, with a click to skip."
date: 2026-12-28T03:30:00Z
tags: [react, nextjs, motion, animation]
keywords: [next.js splash screen, react intro animation, motion layout animation logo, loading screen react, animate element to another position]
---

The intro on this site is a three-second splash: the logo assembles in the middle of a black screen, then shrinks and travels into the top-left corner where the nav logo sits, and the page content fades up under it. It looks like a layout animation, but it is simpler and more robust than that: measure where the target is, animate to that delta, swap.

## The phases

```
splash  →  travel  →  done
```

- **splash**: an overlay covers everything; the big logo plays its assembly animation for a fixed time.
- **travel**: measure the nav logo's rectangle, animate the big logo's `x`, `y` and `scale` to match it.
- **done**: unmount the overlay, show the nav logo, mount the page content so its own entrance animations run.

Server and client both start in `splash`. That matters for hydration: the first render is identical everywhere, and only an effect decides whether to skip.

## Measuring the target

The nav logo carries a data attribute. When the assembly time is up, read both rectangles and compute the delta:

```tsx
const anchor = document.querySelector<HTMLElement>("[data-brand-anchor]");
const a = anchor.getBoundingClientRect();
const m = markRef.current.getBoundingClientRect();
setTravel({ x: a.left - m.left, y: a.top - m.top, scale: a.width / m.width });
setPhase("travel");
```

With `transformOrigin: "top left"` on the big logo, translating by that delta and scaling by that ratio puts its top-left corner exactly on the nav logo's top-left corner at the same size. This works for any viewport because nothing is hard-coded; a 390 px phone and a 1440 px desktop both land precisely.

```tsx
<motion.div
  ref={markRef}
  style={{ transformOrigin: "top left" }}
  animate={phase === "travel" && travel ? { x: travel.x, y: travel.y, scale: travel.scale } : { x: 0, y: 0, scale: 1 }}
  transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
  onAnimationComplete={() => phase === "travel" && finish()}
  className="h-24 w-24 sm:h-32 sm:w-32"
>
  <BrandMark />
</motion.div>
```

## The handoff

While the overlay is up, the real nav logo is rendered but at `opacity: 0`. When travel completes, `finish()` sets the phase to `done`, the overlay fades out over 350 ms, and the nav logo's opacity goes to 1. Because the two are at the same position and size, the eye reads one logo that stopped moving.

The page content is wrapped in a component that hides it during the splash and remounts it afterwards:

```tsx
export function SplashContent({ children }) {
  const phase = useSplashPhase();
  const done = phase === "done";
  return <div key={done ? "site" : "pre"} className={done ? undefined : "invisible"}>{children}</div>;
}
```

Changing the `key` remounts the subtree, so hero text reveals and scroll animations play after the logo lands rather than invisibly behind the overlay.

## Once per session, skippable

```tsx
useEffect(() => {
  if (sessionStorage.getItem("splash-shown") === "1") {
    const t = setTimeout(() => setPhase("done"), 0);
    return () => clearTimeout(t);
  }
  document.body.style.overflow = "hidden";
  const t = setTimeout(startTravel, 3000);
  return () => { clearTimeout(t); document.body.style.overflow = ""; };
}, []);
```

Refreshes and back-navigation skip it. Any click on the overlay calls `finish()` early. Scrolling is locked while it plays so the measurement is not taken against a half-scrolled page.

## Mistakes to avoid

- **Measuring before fonts and layout settle.** Measure at the moment you start the travel, not on mount.
- **Using a different element for the big and small logos.** Same component, same aspect ratio, or the scale maths is wrong.
- **Playing it on every page load.** Visitors arriving from a search result want the page, not a show. Once per session is the compromise I settled on, and most people see it exactly once.
- **Forgetting reduced motion.** I chose to keep the animation for everyone, but it is a conscious choice; the overlay still works as a plain fade if you prefer to honour the setting.

## Sources

- Motion `animate` props and `onAnimationComplete`: [motion.dev/docs/react-motion-component](https://motion.dev/docs/react-motion-component)
- `getBoundingClientRect`: [developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect](https://developer.mozilla.org/en-US/docs/Web/API/Element/getBoundingClientRect)
- React `key` and remounting: [react.dev/learn/preserving-and-resetting-state](https://react.dev/learn/preserving-and-resetting-state)
