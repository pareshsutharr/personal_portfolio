"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { ActionResult, TablesUpdate } from "@/types";
import { dbError, fail, ok, requireAdmin, revalidatePublic } from "./helpers";

export type ProfileImageField = "profile_photo" | "hero_photo" | "about_photo";

const fieldSchema = z.enum(["profile_photo", "hero_photo", "about_photo"]);
const urlSchema = z.url("Invalid URL").nullable();

const LABELS: Record<ProfileImageField, string> = {
  profile_photo: "Profile photo",
  hero_photo: "Hero photo",
  about_photo: "About photo",
};

async function singletonProfileId(supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"]) {
  const { data, error } = await supabase.from("profiles").select("id").limit(1).maybeSingle();
  if (error) return { id: null, error };
  return { id: data?.id ?? null, error: null };
}

/** Sets one of the profile's photo fields (profile / hero / about) to a media URL. */
export async function setProfileImage(
  field: ProfileImageField,
  url: string | null,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const f = fieldSchema.safeParse(field);
  if (!f.success) return fail("Unknown profile image field.");
  const u = urlSchema.safeParse(url);
  if (!u.success) return fail("Invalid image URL.");

  const profile = await singletonProfileId(supabase);
  if (profile.error) return fail(dbError(profile.error, "Could not load profile."));
  if (!profile.id) return fail("No profile row exists yet. Create it from Profile first.");

  const patch: TablesUpdate<"profiles"> = {};
  patch[f.data] = u.data;
  const { error } = await supabase.from("profiles").update(patch).eq("id", profile.id);
  if (error) return fail(dbError(error, "Could not update profile image."));

  revalidatePublic(["/", "/about"]);
  revalidatePath("/admin/profile");
  return ok(null, `${LABELS[f.data]} updated.`);
}

/** Replaces (or clears) the resume PDF URL on the singleton profile row. */
export async function updateResumeUrl(url: string | null): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const u = urlSchema.safeParse(url);
  if (!u.success) return fail("Invalid resume URL.");

  const profile = await singletonProfileId(supabase);
  if (profile.error) return fail(dbError(profile.error, "Could not load profile."));
  if (!profile.id) return fail("No profile row exists yet. Create it from Profile first.");

  const { error } = await supabase
    .from("profiles")
    .update({ resume_url: u.data })
    .eq("id", profile.id);
  if (error) return fail(dbError(error, "Could not update resume."));

  revalidatePublic(["/resume", "/about"]);
  revalidatePath("/admin/resume");
  return ok(null, u.data ? "Resume updated." : "Resume removed.");
}
