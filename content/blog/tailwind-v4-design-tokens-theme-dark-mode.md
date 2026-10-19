---
title: "Tailwind v4 design tokens: one @theme block, dark mode, and no config file"
description: "Tailwind v4 moved configuration into CSS. This site's entire design system, colours, type scale, radii, shadows, motion, is about sixty lines in one @theme block. How it is organised, how dark mode works with it, and the two habits from v3 that no longer apply."
date: 2027-11-29T03:30:00Z
tags: [tailwind, css, design-system, nextjs]
keywords: [tailwind v4 theme variables, tailwind v4 dark mode, tailwind css design tokens, tailwind v4 no config file, tailwind v4 custom colors]
project: portfolio
image: /blog/stock/code-1.webp
imageAlt: "Laptop showing a code editor"
imageCredit: "Tirza van Dijk tirzavandijk"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Laptop_coding_programs_(Unsplash).jpg"
imageLicense: "CC0"
---

When I rebuilt this site on Tailwind v4 the `tailwind.config.js` file went away and did not come back. Everything it used to hold lives in `app/globals.css`, as CSS variables that Tailwind reads to generate utilities. The result is shorter, easier to read, and usable from plain CSS when a component needs it.

## The @theme block

```css
@import "tailwindcss";

@theme {
  --color-bg-950: oklch(0.13 0.005 260);
  --color-bg-900: oklch(0.17 0.006 260);
  --color-bg-800: oklch(0.22 0.007 260);
  --color-fg: oklch(0.96 0 0);
  --color-fg-muted: oklch(0.72 0.01 260);
  --color-accent: oklch(0.72 0.19 45);        /* the orange from the logo */
  --color-accent-soft: oklch(0.72 0.19 45 / 0.14);
  --color-success: oklch(0.75 0.17 150);
  --color-warning: oklch(0.82 0.16 80);

  --font-sans: "Inter Variable", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono Variable", ui-monospace, monospace;

  --text-display: 3.5rem;
  --text-display--line-height: 1.02;
  --text-display--letter-spacing: -0.03em;

  --radius-card: 1.25rem;
  --shadow-card: 0 1px 0 0 oklch(1 0 0 / 0.04) inset, 0 20px 50px -20px oklch(0 0 0 / 0.6);

  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --animate-rise: rise 0.7s var(--ease-out-expo) both;
  @keyframes rise { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: none } }
}
```

Each variable's prefix decides the utilities it generates: `--color-accent` gives `bg-accent`, `text-accent`, `border-accent`; `--radius-card` gives `rounded-card`; `--shadow-card` gives `shadow-card`; `--animate-rise` gives `animate-rise`. `--text-display` with its `--line-height` and `--letter-spacing` companions gives a `text-display` utility that sets all three.

## Why oklch

Every colour is in `oklch` so that lighter and darker steps are perceptually even and the accent keeps its character when desaturated for the soft variant. `oklch(0.72 0.19 45 / 0.14)` is the accent at 14% opacity for subtle backgrounds, which in v3 needed a plugin or a hex-with-alpha hack.

## Dark mode without a class on html

This site is dark by default and offers no light mode, so the theme is simply the dark palette. For client projects that need both, the pattern is:

```css
@theme {
  --color-surface: var(--surface);
  --color-ink: var(--ink);
}
:root { --surface: oklch(0.99 0 0); --ink: oklch(0.2 0 0); }
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { --surface: oklch(0.15 0 0); --ink: oklch(0.95 0 0); }
}
:root[data-theme="dark"] { --surface: oklch(0.15 0 0); --ink: oklch(0.95 0 0); }
```

The `@theme` values point at plain variables that change with the colour scheme, so `bg-surface` is light or dark with no `dark:` prefix anywhere in the markup. A `data-theme` attribute lets the user override the system preference. Components use `bg-surface text-ink` and never think about mode.

## Using tokens from plain CSS

Motion components and the prose styles for this blog need values Tailwind utilities cannot express. The theme variables are ordinary CSS custom properties, so:

```css
.prose-blog pre { border-radius: var(--radius-card); background: var(--color-bg-900); }
.prose-blog a { color: var(--color-accent); text-decoration-color: var(--color-accent-soft); }
```

One source of truth for the utility classes and the hand-written CSS.

## Two v3 habits to drop

**`theme()` in CSS.** Use `var(--color-accent)`. The function still works but the variable is the native way and needs no build step to understand.

**Extending via config for one-off values.** Arbitrary values like `w-[37rem]` are fine for one-offs. The theme is for values that recur. A token used once is noise; a magic number used three times is a missing token.

## What it costs

The generated CSS for this site is under 30 KB compressed, because v4 only emits the utilities the templates use and the theme itself is a few dozen variables. The design decisions fit on one screen, which is the real benefit when revisiting a project after six months.

## Sources

- Tailwind v4 theme variables: [tailwindcss.com/docs/theme](https://tailwindcss.com/docs/theme)
- Tailwind v4 dark mode: [tailwindcss.com/docs/dark-mode](https://tailwindcss.com/docs/dark-mode)
- oklch explained: [evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl](https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl)
- Tailwind v4 upgrade guide: [tailwindcss.com/docs/upgrade-guide](https://tailwindcss.com/docs/upgrade-guide)
