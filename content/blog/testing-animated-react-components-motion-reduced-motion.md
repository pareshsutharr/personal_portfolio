---
title: "Testing animated React components: what to assert, what to skip, and how the splash screen got a test"
description: "Animation code is the least-tested code in most front ends because the animation is not what you should be testing. The splash screen, the assembling logo and the scroll effects on this site have tests now, and none of them check that something moved. What they check instead: end states, reduced-motion behaviour, the session gate, and timing contracts. With the jsdom setup that makes Motion not explode."
date: 2028-08-21T03:30:00Z
tags: [testing, react, motion, vitest, frontend]
keywords: [testing framer motion components, vitest jsdom framer motion, test prefers-reduced-motion react, testing animations react testing library, mock IntersectionObserver vitest]
project: portfolio
image: /blog/stock/keyboard-2.webp
imageAlt: "Laptop keyboard in low light"
imageCredit: "Markus Petritz petritzdesigns"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Backlit_laptop_keyboard_(Unsplash).jpg"
imageLicense: "CC0"
summary: "Do not test that things move; test the end state, the reduced-motion path, the gates such as once-per-session, the timing contract and the accessibility attributes. A few jsdom stubs for observers and matchMedia plus fake timers make Motion components testable in Vitest."
faq:
  - q: "What should a test of an animated component assert?"
    a: "That the content is present after the animation, that it still finishes under reduced motion, that session or route gates behave, and that decorative layers are aria-hidden."
  - q: "Why does Motion throw in jsdom?"
    a: "jsdom lacks IntersectionObserver, ResizeObserver, matchMedia and Element.animate. Minimal stubs in the test setup stop the constructors throwing."
  - q: "How do I test a three-second splash without waiting three seconds?"
    a: "Vitest fake timers: advance 2999 ms, assert the splash is still there, advance 1 ms, assert it is gone."
---

The splash screen on this site had a bug for a week: under "reduce motion" it never finished, so the site never appeared. No test caught it because there were no tests for anything animated. The reason there were none is a good one, badly applied: you should not test that things animate. You should test what the animation is for.

## What is worth asserting

| Assert | Why |
|---|---|
| The end state renders | After the splash, the page content is in the DOM and the splash is not |
| Reduced motion still reaches the end state | The bug above; the most common animation failure |
| Gates and guards | Splash shows once per session; the logo replays on route change |
| Timing contracts | "3 seconds, then the site" is a product promise, not an implementation detail |
| Accessibility attributes | `aria-hidden` on decorative layers; focus is not trapped by an overlay |

What is not worth asserting: intermediate transform values, easing curves, that a class toggled at frame 12. Those change every time the design is tuned and the tests would fail without anything being wrong.

## Setup: making Motion and friends run in jsdom

```ts
// vitest.setup.ts
import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

class IO { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } }
globalThis.IntersectionObserver = IO as any;
globalThis.ResizeObserver = IO as any;
window.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: query.includes("prefers-reduced-motion") ? globalThis.__reducedMotion ?? false : false,
  media: query, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false,
}));
Element.prototype.scrollTo = () => {};
Element.prototype.animate ??= () => ({ finished: Promise.resolve(), cancel() {}, pause() {}, play() {} } as any);
```

jsdom has no layout, no observers and no `matchMedia`. Each stub is the minimum that stops a constructor throwing. The `__reducedMotion` global is a switch tests flip.

## The splash tests

```tsx
import { render, screen, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { SplashProvider } from "@/components/splash";

const Page = () => <SplashProvider><main>Site</main></SplashProvider>;

beforeEach(() => { sessionStorage.clear(); vi.useFakeTimers(); globalThis.__reducedMotion = false; });

describe("splash", () => {
  it("hides the site for 3 seconds, then shows it", () => {
    render(<Page />);
    expect(screen.getByTestId("splash")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("aria-hidden", "true");
    act(() => vi.advanceTimersByTime(2999));
    expect(screen.getByTestId("splash")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1));
    expect(screen.queryByTestId("splash")).not.toBeInTheDocument();
    expect(screen.getByRole("main")).not.toHaveAttribute("aria-hidden");
  });

  it("still finishes under reduced motion", () => {
    globalThis.__reducedMotion = true;
    render(<Page />);
    act(() => vi.advanceTimersByTime(3000));
    expect(screen.queryByTestId("splash")).not.toBeInTheDocument();
  });

  it("shows once per session", () => {
    const first = render(<Page />);
    act(() => vi.advanceTimersByTime(3000));
    first.unmount();
    render(<Page />);
    expect(screen.queryByTestId("splash")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("ps-splash-shown")).toBe("1");
  });
});
```

Fake timers make a three-second animation a zero-second test. The second test is the one that would have caught the bug: the reduced-motion path had skipped the animation *and* the completion callback.

## The logo assembly

The brand mark animates five layers into place and replays on route change and hover. Its tests render it, change the pathname through a mocked `usePathname`, and assert that the `data-run` counter incremented and that all five layer images are present with `aria-hidden`. Whether they slid in from the left is not asserted.

## Scroll effects

Scroll-linked components are given a stubbed `useScroll` that returns a controllable motion value. The test sets the value to 0 and 1 and asserts the end states: at 0 the hero is at full opacity; at 1 it is hidden and the logo strip has `z-10`. That is the overlap bug from earlier in this series, pinned as a test.

## Visual checks stay visual

The things these tests cannot catch, a janky easing or a layer landing two pixels off, are checked by the headless-browser screenshot scripts described in the Lighthouse post, run before a deploy and compared by eye. A unit test for "does it look right" does not exist and pretending one does wastes time.

## Sources

- Testing Library guiding principles: [testing-library.com/docs/guiding-principles](https://testing-library.com/docs/guiding-principles/)
- Vitest fake timers: [vitest.dev/api/vi.html#vi-usefaketimers](https://vitest.dev/api/vi.html#vi-usefaketimers)
- Motion's `useReducedMotion`: [motion.dev/docs/react-use-reduced-motion](https://motion.dev/docs/react-use-reduced-motion)
- jsdom limitations, layout and observers: [github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform](https://github.com/jsdom/jsdom#unimplemented-parts-of-the-web-platform)
