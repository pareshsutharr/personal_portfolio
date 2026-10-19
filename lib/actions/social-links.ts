"use server";

import { socialLinkSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, SocialLink } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

export async function createSocialLink(input: unknown): Promise<ActionResult<SocialLink>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(socialLinkSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("social_links")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not create link."));
  revalidatePublic();
  return ok(data, "Link created.");
}

export async function updateSocialLink(
  id: string,
  input: unknown,
): Promise<ActionResult<SocialLink>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(socialLinkSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("social_links")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update link."));
  revalidatePublic();
  return ok(data, "Link saved.");
}

export async function deleteSocialLink(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("social_links").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete link."));
  revalidatePublic();
  return ok(null, "Link deleted.");
}

export async function reorderSocialLinks(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("social_links")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic();
  return ok(null, "Order saved.");
}

export async function toggleSocialLink(
  id: string,
  field: "is_visible",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "is_visible" ? { is_visible: value } : {};
  const { error } = await supabase.from("social_links").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update link."));
  revalidatePublic();
  return ok(null);
}
