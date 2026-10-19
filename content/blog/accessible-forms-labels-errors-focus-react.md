---
title: "Accessible forms in React: labels, errors, focus and the keyboard, tested with a screen reader"
description: "A leave form that a screen reader announces as 'edit text, edit text, button' is a form half the office cannot use. The six things every form in my projects now does, the code for each, and the ten-minute VoiceOver test that catches most mistakes."
date: 2027-12-06T03:30:00Z
tags: [accessibility, react, forms, frontend]
keywords: [accessible form react, aria-describedby error message, focus first invalid field, screen reader form testing, accessible form validation]
project: growth-avenues-hrms
image: /blog/stock/keyboard-2.webp
imageAlt: "Laptop keyboard in low light"
imageCredit: "Markus Petritz petritzdesigns"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Backlit_laptop_keyboard_(Unsplash).jpg"
imageLicense: "CC0"
---

The HRMS has an employee who uses a screen reader. The first version of the leave form had placeholder text instead of labels, red borders instead of error messages, and a submit button that did nothing announceable when it failed. He could not use it. Fixing it took an afternoon and produced a checklist that every form since has followed.

## 1. Every input has a label, in the markup

```tsx
<label htmlFor="reason" className="block text-sm font-medium">Reason</label>
<textarea id="reason" name="reason" />
```

Placeholders disappear when you type and are not labels. If the design hides the label, hide it visually with an `sr-only` class, not by removing it. The `htmlFor`/`id` pair is what a screen reader uses to say "Reason, edit text".

## 2. Errors are connected to their fields

A red border is invisible to someone who cannot see it. The error text must be associated:

```tsx
<input id="to" name="to" aria-invalid={!!errors.to} aria-describedby={errors.to ? "to-error" : "to-hint"} />
<p id="to-hint" className="text-xs text-fg-muted">YYYY-MM-DD</p>
{errors.to && <p id="to-error" role="alert" className="text-xs text-warning">{errors.to[0]}</p>}
```

`aria-describedby` makes the hint and the error part of what is read when the field gets focus. `aria-invalid` makes the field announce as "invalid". `role="alert"` makes the error read out the moment it appears.

## 3. Focus moves to the first problem on submit

When the server rejects the form, the person should not have to hunt for the red text:

```tsx
useEffect(() => {
  if (!state?.fieldErrors) return;
  const first = Object.keys(state.fieldErrors)[0];
  document.getElementById(first)?.focus();
}, [state]);
```

Field ids match schema keys, so the first error key is the first field to focus. Sighted users benefit just as much on long forms.

## 4. The form-level outcome is announced

```tsx
<div aria-live="polite" className="sr-only">{state?.ok ? "Leave request submitted" : state?.error}</div>
```

A live region reads whatever appears in it. Success toasts that animate in the corner are not heard; this one line is.

## 5. Everything works with Tab and Enter

Custom dropdowns and date pickers are where keyboard support dies. The rules: native `<select>` and `<input type="date">` unless there is a strong reason; if a custom one is unavoidable, it must open on Enter or Space, move with arrow keys, close on Escape, and return focus to the trigger. A headless component library that already does this is cheaper than writing it.

Focus must be visible. Tailwind's `focus-visible:ring-2 focus-visible:ring-accent` on every interactive element, never `outline-none` without a replacement.

## 6. Buttons say what they do

"Submit" is fine; an icon-only button is not, unless it has `aria-label="Remove attachment"`. A button that is loading should say so: `aria-busy="true"` and text that changes to "Submitting…", not just a spinner.

## The ten-minute test

On a Mac, turn on VoiceOver (Cmd+F5), put the mouse away, and fill the form with the keyboard only. Listen for:

- Each field announced with its label and hint.
- An error announced when you tab out of or submit an invalid field.
- Focus landing on the first invalid field after a failed submit.
- The success message spoken after a good submit.

On Windows, NVDA is free and the test is the same. If any of the four fails, the form is not done. Automated tools catch missing labels and contrast; they do not catch a focus order that makes no sense or an error nobody hears.

## Contrast and size

Error text in a pale red on white fails contrast. The warning colour on this site is chosen so text meets 4.5:1 against the background. Touch targets are at least 44 px tall. These two fix most "it looks fine to me" complaints from people who are not the person complaining.

## Sources

- WAI forms tutorial: [w3.org/WAI/tutorials/forms](https://www.w3.org/WAI/tutorials/forms/)
- `aria-describedby`: [developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-describedby)
- ARIA live regions: [developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions)
- WCAG 2.2 quick reference: [w3.org/WAI/WCAG22/quickref](https://www.w3.org/WAI/WCAG22/quickref/)
- NVDA screen reader: [nvaccess.org](https://www.nvaccess.org/)
