---
title: "Accessibility audit of a finance site: the twelve fixes that mattered"
description: "The Growth Avenues website went through an accessibility review as part of being a regulated broker's site. Most findings were small and mechanical. Here they are, with the fix for each, so your site passes the same review the first time."
date: 2027-03-22T03:30:00Z
tags: [accessibility, react, html, compliance]
keywords: [website accessibility audit india, wcag fixes react, accessible forms react, keyboard navigation website, screen reader testing]
project: growth-avenues
image: /blog/stock/keyboard-1.webp
imageAlt: "Backlit laptop keyboard close-up"
imageCredit: "Bike756"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Close_up_of_IBM_Laptop_Keyboard.JPG"
imageLicense: "Public domain"
summary: "Most findings in a regulated finance site's accessibility review were small and mechanical: contrast, labels, focus states, heading order, link text, alt text and keyboard traps. Twelve fixes cleared the review and each takes minutes once you know what to look for."
faq:
  - q: "What fails most often in an accessibility audit of a corporate site?"
    a: "Low-contrast grey text, buttons without accessible names, missing focus styles and heading levels used for size rather than structure."
  - q: "Do automated tools find everything?"
    a: "No. They catch contrast and missing labels; they miss a focus order that makes no sense and an error nobody hears. A short screen reader pass finds those."
  - q: "Why does a broker's site need to pass this?"
    a: "Regulated firms are expected to serve all clients, and the review was part of the compliance work. The fixes also improved the site for everyone on a phone in sunlight."
---

Accessibility for a broker's website is not a nice-to-have; it is part of the review a regulated site goes through. When the Growth Avenues site was audited, the list of findings looked long and turned out to be mostly a day of mechanical fixes. These are the twelve that came up, in the order I would check them on any site.

## 1. Every image has a real alt, or an empty one

Decorative images get `alt=""`, so screen readers skip them. Meaningful images describe what they show: not "image", not the filename. The audit flagged forty logos with the filename as alt text.

## 2. One `h1` per page, headings in order

Skipping from `h1` to `h4` because the `h4` looked right is the most common finding. Use the heading level for structure and CSS for size.

## 3. Colour contrast of 4.5:1 for text

Grey text on a dark background is where this fails. The site's secondary text went from `#6f6f6f` to `#a0a0a0` on black, which is 7:1. Check with the browser's contrast tool in DevTools; it shows the ratio on hover.

## 4. Focus is visible

Someone removed the outline on buttons because it looked untidy. Keyboard users then could not see where they were. Replace, do not remove:

```css
:focus-visible { outline: 2px solid #ff9a6c; outline-offset: 2px; }
```

`:focus-visible` shows the ring for keyboard focus and not for mouse clicks, which is what the designer wanted all along.

## 5. Everything works with the keyboard

Tab through the whole page. The audit found a dropdown built from `div`s with `onClick` that could not be opened by keyboard. Use `button` for things you click and `a` for things that navigate; both are keyboard-operable for free.

## 6. Forms have labels, not placeholders

A placeholder disappears when you type and is not announced reliably. Every input has a `label` with `htmlFor`, and required fields say so in text as well as colour.

```tsx
<label htmlFor="pan">PAN number <span aria-hidden>*</span><span className="sr-only">(required)</span></label>
<input id="pan" name="pan" required aria-describedby="pan-hint" />
<p id="pan-hint">Ten characters, as on your PAN card.</p>
```

## 7. Errors are announced and linked

An error message in red under the field is invisible to a screen reader unless the field points to it. `aria-invalid="true"` on the input and `aria-describedby` to the error element fixes it. On submit, move focus to the first error.

## 8. Skip link

A "Skip to content" link as the first focusable element, visible when focused. Keyboard users do not want to tab through forty nav links on every page.

## 9. Tables are tables

The complaint data table was built from `div`s. Screen readers could not read it as a table. Use `table`, `th` with `scope`, and a `caption`.

## 10. Motion respects the user's setting

Marquees and auto-playing animations stop or simplify under `prefers-reduced-motion`. The site's scrolling logo strip pauses; scroll-linked effects become static.

## 11. Documents are accessible too

Risk disclosure PDFs scanned as images are not readable. Re-exported from the source document with text, headings and a language set. This one took longer than the whole website.

## 12. Language and page titles

`<html lang="en">` so screen readers choose the right voice, and a unique `<title>` per page so browser tabs and history make sense.

## How to test in twenty minutes

- Run Lighthouse's accessibility audit. It catches 1, 2, 3, 6 and 12.
- Unplug the mouse and use the site. Catches 4, 5, 7 and 8.
- Turn on VoiceOver or NVDA and read the home page and one form. Catches everything else.

Automated tools find about a third of real problems. The keyboard and the screen reader find the rest.

## Sources

- WCAG 2.2 quick reference: [w3.org/WAI/WCAG22/quickref](https://www.w3.org/WAI/WCAG22/quickref/)
- MDN accessibility guides: [developer.mozilla.org/en-US/docs/Web/Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)
- Lighthouse accessibility audits: [developer.chrome.com/docs/lighthouse/accessibility](https://developer.chrome.com/docs/lighthouse/accessibility/)
- Guidelines for Indian Government Websites, accessibility section, as a reference many reviewers use: [guidelines.india.gov.in](https://guidelines.india.gov.in/)
