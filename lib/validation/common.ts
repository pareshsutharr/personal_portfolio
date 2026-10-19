import { z } from "zod";
import { SLUG_PATTERN } from "@/lib/utils/slug";

/** Empty strings from forms become null. */
export const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .nullable()
  .optional();

export const requiredText = (label: string, max = 500) =>
  z.string().trim().min(1, `${label} is required`).max(max, `${label} is too long`);

export const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.url("Enter a valid URL (include https://)").nullable())
  .nullable()
  .optional();

export const optionalEmail = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(z.email("Enter a valid email").nullable())
  .nullable()
  .optional();

export const slug = z
  .string()
  .trim()
  .min(2, "Slug is too short")
  .max(80, "Slug is too long")
  .regex(SLUG_PATTERN, "Use lowercase letters, numbers and hyphens only");

/** YYYY-MM-DD or null. */
export const optionalDate = z
  .string()
  .trim()
  .transform((v) => (v === "" ? null : v))
  .pipe(
    z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
      .nullable(),
  )
  .nullable()
  .optional();

export const displayOrder = z.coerce.number().int().min(0).default(0);

export const boolFromForm = z
  .union([z.boolean(), z.enum(["true", "false", "on", "off", ""])])
  .transform((v) => v === true || v === "true" || v === "on")
  .default(false);

/** Comma- or newline-separated list → string[] */
export const textList = z
  .union([z.array(z.string()), z.string()])
  .transform((v) => {
    const arr = Array.isArray(v) ? v : v.split(/\r?\n|,/);
    return arr.map((s) => s.trim()).filter(Boolean);
  })
  .default([]);

/** Newline-separated list (keeps commas inside items). */
export const lineList = z
  .union([z.array(z.string()), z.string()])
  .transform((v) => {
    const arr = Array.isArray(v) ? v : v.split(/\r?\n/);
    return arr.map((s) => s.trim()).filter(Boolean);
  })
  .default([]);

export const uuid = z.uuid("Invalid id");

export const reorderSchema = z.object({
  ids: z.array(uuid).min(1),
});

export type FieldErrors = Record<string, string[]>;

export function flattenErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_root";
    (out[key] ??= []).push(issue.message);
  }
  return out;
}
