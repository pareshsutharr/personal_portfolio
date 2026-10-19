import "server-only";

import { revalidatePath } from "next/cache";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { flattenErrors } from "@/lib/validation/common";
import type { ActionResult } from "@/types";

/**
 * Resolves the request's Supabase client and asserts the caller is an admin.
 * Throws if not: server actions must never trust the UI alone.
 */
export async function requireAdmin() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const role = data?.claims?.app_metadata?.role;
  if (error || !data || role !== "admin") {
    throw new Error("Unauthorized");
  }
  return { supabase, userId: data.claims.sub };
}

/** Parses unknown input against a schema and returns a typed failure if invalid. */
export function parseInput<S extends z.ZodType>(
  schema: S,
  input: unknown,
): { ok: true; data: z.output<S> } | { ok: false; result: ActionResult<never> } {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      result: {
        ok: false,
        error: "Please fix the highlighted fields.",
        fieldErrors: flattenErrors(parsed.error),
      },
    };
  }
  return { ok: true, data: parsed.data };
}

/** Converts a FormData into a plain object (repeated keys become arrays). */
export function formDataToObject(formData: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of formData.entries()) {
    if (value instanceof File) continue;
    if (key.endsWith("[]")) {
      const k = key.slice(0, -2);
      const existing = out[k];
      if (Array.isArray(existing)) existing.push(value);
      else out[k] = [value];
    } else if (key in out) {
      const existing = out[key];
      out[key] = Array.isArray(existing) ? [...existing, value] : [existing, value];
    } else {
      out[key] = value;
    }
  }
  return out;
}

/**
 * Public pages use ISR; after any admin mutation we invalidate the whole
 * public tree so changes show up immediately.
 */
export function revalidatePublic(paths: string[] = []) {
  revalidatePath("/", "layout");
  for (const p of paths) revalidatePath(p);
}

export function fail(error: string): ActionResult<never> {
  return { ok: false, error };
}

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

/** Maps a Supabase/Postgres error to a friendly message. */
export function dbError(error: { code?: string; message: string } | null, fallback: string) {
  if (!error) return fallback;
  if (error.code === "23505") return "That slug or name already exists. Choose another.";
  if (error.code === "23503") return "This record is referenced by another record.";
  if (error.code === "42501") return "You do not have permission to do that.";
  return error.message || fallback;
}
