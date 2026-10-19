---
title: "Input validation with Zod in Express and Next.js: one schema, both sides"
description: "Every form and API body I ship is described once as a Zod schema. The server rejects what does not match; the client shows the same messages as people type. How the schemas are shared, how errors are shaped, and the three validations that stopped real bad data."
date: 2027-10-11T03:30:00Z
tags: [zod, validation, express, nextjs, typescript]
keywords: [zod validation express middleware, zod server action next.js, share validation schema client server, zod error flatten, typescript api validation]
image: /blog/stock/keyboard-1.webp
imageAlt: "Backlit laptop keyboard close-up"
imageCredit: "Bike756"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Close_up_of_IBM_Laptop_Keyboard.JPG"
imageLicense: "Public domain"
---

Validation is the part of an app that is boring to write and expensive to skip. A leave request with an end date before the start date, a PAN number in lowercase, an amount with a comma in it: each got into a database of mine once. Now every input passes through a Zod schema, and the same schema runs in the browser so the person sees the error before they submit.

## Schemas live in a shared module

```ts
// lib/validation/leave.ts
import { z } from "zod";

export const leaveSchema = z.object({
  type: z.enum(["casual", "sick", "earned"]),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  halfDay: z.boolean().default(false),
  reason: z.string().trim().min(10, "Give a short reason").max(500),
}).refine((v) => v.to >= v.from, { message: "End date must be on or after the start date", path: ["to"] });

export type LeaveInput = z.infer<typeof leaveSchema>;
```

The `path` in `refine` attaches a cross-field error to a specific field, so the form highlights the end date rather than showing a floating message. The inferred type means the handler's `input` is typed without writing an interface.

## Express: a validate middleware

```ts
export const validate = (schema: z.ZodType, source: "body" | "query" | "params" = "body") =>
  (req, res, next) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid input", code: "validation_failed", details: flatten(result.error) });
    }
    req.validated = { ...(req.validated ?? {}), [source]: result.data };
    next();
  };

router.post("/leave", requireAuth, validate(leaveSchema), async (req, res) => {
  const input: LeaveInput = req.validated.body;   // typed, trimmed, defaults applied
  // ...
});
```

Zod does more than check: it trims, coerces, applies defaults and strips unknown keys. The handler receives exactly the shape it declared and nothing else, which closes the "mass assignment" hole where a client sends `role: "admin"` in a profile update and a careless `Model.updateOne(req.body)` saves it.

## Next.js: the same schema in a server action

```ts
"use server";
export async function submitLeave(_prev: ActionResult | null, formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const parsed = leaveSchema.safeParse({ ...raw, halfDay: raw.halfDay === "on" });
  if (!parsed.success) return { ok: false, error: "Please fix the highlighted fields", fieldErrors: flatten(parsed.error) };
  // ...
}
```

Form data is all strings, so booleans and numbers need a nudge; `z.coerce.number()` and a checkbox mapping handle most of it.

## The client uses it too

```tsx
const errors = useMemo(() => {
  const r = leaveSchema.safeParse(values);
  return r.success ? {} : flatten(r.error);
}, [values]);
// <FieldError errors={touched.to ? errors.to : undefined} />
```

Only show an error after the field has been touched, or the form opens covered in red. The server remains the authority: the client check is a convenience, and anyone can skip it.

## Flattening errors into something a form can use

```ts
export function flatten(error: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
```

`{ to: ["End date must be on or after the start date"] }` is the shape every form in the codebase understands.

## Three validations that earned their keep

1. **PAN format**: `z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/)` with `.transform((s) => s.toUpperCase())` before it. Lowercase PANs from phone keyboards were a weekly cleanup.
2. **Amounts**: `z.coerce.number().positive().multipleOf(0.01)` after stripping commas in a `preprocess`. "12,500" was being stored as `12`.
3. **Dates as strings**: never `z.date()` from a form. `YYYY-MM-DD` as a string, validated by regex, compared as strings. The attendance post explains why.

## Sources

- Zod: [zod.dev](https://zod.dev/)
- Zod `refine` and `superRefine` for cross-field rules: [zod.dev/api#refinements](https://zod.dev/api#refinements)
- OWASP input validation cheat sheet: [cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Input_Validation_Cheat_Sheet.html)
- Mass assignment, explained: [cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html](https://cheatsheetseries.owasp.org/cheatsheets/Mass_Assignment_Cheat_Sheet.html)
