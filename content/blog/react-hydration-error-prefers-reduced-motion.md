---
title: "The React hydration error that only hit phones with Reduce Motion on"
description: "A bug from this very site: a counter rendered one number on the server and another on the client whenever the visitor had Reduce Motion enabled. What caused it, how I found it with headless Chrome, and the one-line fix."
date: 2026-11-09T03:30:00Z
tags: [react, nextjs, motion, accessibility, debugging]
keywords: [react hydration error 418, text content does not match server-rendered html, useReducedMotion hydration mismatch, framer motion reduced motion ssr, next.js hydration mismatch]
image: /blog/stock/code-1.webp
imageAlt: "Laptop showing a code editor"
imageCredit: "Tirza van Dijk tirzavandijk"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Laptop_coding_programs_(Unsplash).jpg"
imageLicense: "CC0"
summary: "A counter's initial state depended on useReducedMotion, which is false on the server and true for visitors with Reduce Motion on, so the server and client rendered different numbers. Make the first render identical regardless of the preference and apply motion differences after mount."
faq:
  - q: "What causes React hydration error 418?"
    a: "The server-rendered HTML differs from the client's first render. Anything that reads browser-only state during the initial render, such as media queries, can cause it."
  - q: "How did you find a bug that only phones with Reduce Motion showed?"
    a: "Headless Chrome with the prefers-reduced-motion media feature emulated reproduced it, and the console pointed at the component."
  - q: "What is the fix pattern?"
    a: "Initial state equals the final value; the animation, if any, starts in an effect after hydration."
---

A visitor told me the logo animation on this portfolio "wasn't working" on their iPhone. It was working on mine. The difference turned out to be a setting most developers never test with: Accessibility, Motion, Reduce Motion.

Chasing that led to a real bug that had nothing to do with the logo. Every page on the site was throwing React error #418, a hydration mismatch, for anyone with Reduce Motion on. Here is what it was, how I reproduced it without owning that phone, and the fix.

## The symptom

React error #418 in production reads, after you un-minify it:

> Hydration failed because the server rendered text didn't match the client.

React recovers by re-rendering the whole tree on the client, so the page still shows. But it is slower, the console is red, and it is a sign that something renders differently in two places.

## Reproducing it without the phone

Chrome can emulate the `prefers-reduced-motion` media query. I drove a headless Chrome through the DevTools protocol, which is a plain WebSocket, and asked it to pretend the visitor prefers reduced motion:

```js
// Node 22+, no dependencies: WebSocket is built in.
await send("Emulation.setEmulatedMedia", {
  features: [{ name: "prefers-reduced-motion", value: "reduce" }],
});
await send("Page.navigate", { url: "http://localhost:3000/" });
// Runtime.exceptionThrown events now show the #418 errors.
```

If you do not want to script it, Chrome DevTools has the same switch under Rendering, "Emulate CSS media feature prefers-reduced-motion". Reload with it on and watch the console.

## The cause

The site has a counter that animates a number up from zero when it scrolls into view. The component used Motion's `useReducedMotion()` to skip the animation for people who prefer it:

```tsx
const reduce = useReducedMotion();
const [display, setDisplay] = useState(reduce ? target : 0);
// ...
return <span>{display}</span>;
```

Read that initial state carefully. On the server there is no window and no media query, so `reduce` is `null` and the server renders `0`. In the browser, for a Reduce Motion user, `reduce` is `true` on the very first render, so the client renders `38`. Server says "0", client says "38". That is the mismatch, word for word.

It never showed up for me because with Reduce Motion off, both sides agree on `0`.

## The fix

Make the first render identical everywhere, and move anything that depends on the browser into an effect.

```tsx
const reduce = useReducedMotion();
const [display, setDisplay] = useState(target); // same on server and client

useEffect(() => {
  if (reduce || !inView) return;              // reduced motion: keep the final value
  const controls = animate(0, target, {
    duration: 1.4,
    onUpdate: (v) => setDisplay(Math.round(v)),
  });
  return () => controls.stop();
}, [reduce, inView, target]);
```

Now the server and the client both render the final number. People who are fine with motion see it count up once it scrolls into view; people with Reduce Motion see the number straight away; nobody gets a hydration error.

I had a second instance of the same mistake in a scroll-linked paragraph that rendered plain text for reduced motion and a span per word otherwise. Same fix: render the same markup in both cases and only skip the style changes.

## The general rule

Anything that reads the browser, `window`, `matchMedia`, `localStorage`, the time zone, the user agent, must not change what the first render outputs. Use it in `useEffect`, or read it through `useSyncExternalStore` with a server snapshot that matches your SSR output. Motion's `useReducedMotion` is a convenience, not an exception to this rule.

If you use Motion a lot, there is a cleaner option than fixing each component: wrap the app in `MotionConfig reducedMotion="user"` and let Motion handle the preference inside the animation layer instead of in your JSX.

## What I check now

- Run the site once with Reduce Motion emulated and look for red in the console.
- Search the codebase for `useReducedMotion` and `typeof window` and make sure none of them feed into initial state or initial markup.
- Keep the hydration warning visible in development. It is the only time React tells you exactly which text differed.

## Sources

- React hydration mismatch docs: [react.dev/reference/react-dom/client/hydrateRoot](https://react.dev/reference/react-dom/client/hydrateRoot#handling-different-client-and-server-content)
- Decoding minified React errors: [react.dev/errors/418](https://react.dev/errors/418)
- Motion `useReducedMotion` and `MotionConfig`: [motion.dev/docs/react-use-reduced-motion](https://motion.dev/docs/react-use-reduced-motion)
- Chrome DevTools `Emulation.setEmulatedMedia`: [chromedevtools.github.io/devtools-protocol](https://chromedevtools.github.io/devtools-protocol/tot/Emulation/#method-setEmulatedMedia)
- `prefers-reduced-motion` on MDN: [developer.mozilla.org](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)
