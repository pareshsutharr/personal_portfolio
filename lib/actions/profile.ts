"use server";

import { profileSchema } from "@/lib/validation/schemas";
import type { ActionResult, Profile } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

/**
 * The profile is a singleton: update the existing row if there is one,
 * otherwise insert it. Admin UI always sends the complete form.
 */
export async function updateProfile(input: unknown): Promise<ActionResult<Profile>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(profileSchema, input);
  if (!parsed.ok) return parsed.result;

  const { data: existing, error: lookupError } = await supabase
    .from("profiles")
    .select("id")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (lookupError) return fail(dbError(lookupError, "Could not load profile."));

  if (existing) {
    const { data, error } = await supabase
      .from("profiles")
      .update(parsed.data)
      .eq("id", existing.id)
      .select("*")
      .single();
    if (error) return fail(dbError(error, "Could not save profile."));
    revalidatePublic(["/about"]);
    return ok(data, "Profile saved.");
  }

  const { data, error } = await supabase.from("profiles").insert(parsed.data).select("*").single();
  if (error) return fail(dbError(error, "Could not create profile."));
  revalidatePublic(["/about"]);
  return ok(data, "Profile saved.");
}
