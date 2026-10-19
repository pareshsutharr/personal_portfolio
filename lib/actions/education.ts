"use server";

import { educationSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, Education } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

const PATHS = ["/experience", "/about"];

export async function createEducation(input: unknown): Promise<ActionResult<Education>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(educationSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase.from("education").insert(parsed.data).select("*").single();
  if (error) return fail(dbError(error, "Could not create education entry."));
  revalidatePublic(PATHS);
  return ok(data, "Education entry created.");
}

export async function updateEducation(
  id: string,
  input: unknown,
): Promise<ActionResult<Education>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(educationSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("education")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update education entry."));
  revalidatePublic(PATHS);
  return ok(data, "Education entry saved.");
}

export async function deleteEducation(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("education").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete education entry."));
  revalidatePublic(PATHS);
  return ok(null, "Education entry deleted.");
}

export async function reorderEducation(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("education")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(PATHS);
  return ok(null, "Order saved.");
}

export async function toggleEducation(
  id: string,
  field: "is_visible",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "is_visible" ? { is_visible: value } : {};
  const { error } = await supabase.from("education").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update education entry."));
  revalidatePublic(PATHS);
  return ok(null);
}
