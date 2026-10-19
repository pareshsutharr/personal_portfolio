"use server";

import { experienceSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, Experience } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

const PATHS = ["/experience", "/"];

export async function createExperience(input: unknown): Promise<ActionResult<Experience>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(experienceSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("experiences")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not create experience."));
  revalidatePublic(PATHS);
  return ok(data, "Experience created.");
}

export async function updateExperience(
  id: string,
  input: unknown,
): Promise<ActionResult<Experience>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(experienceSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("experiences")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update experience."));
  revalidatePublic(PATHS);
  return ok(data, "Experience saved.");
}

export async function deleteExperience(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("experiences").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete experience."));
  revalidatePublic(PATHS);
  return ok(null, "Experience deleted.");
}

export async function reorderExperiences(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("experiences")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(PATHS);
  return ok(null, "Order saved.");
}

export async function toggleExperience(
  id: string,
  field: "is_visible",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "is_visible" ? { is_visible: value } : {};
  const { error } = await supabase.from("experiences").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update experience."));
  revalidatePublic(PATHS);
  return ok(null);
}
