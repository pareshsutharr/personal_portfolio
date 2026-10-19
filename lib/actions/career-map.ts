"use server";

import { careerMapStepSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, CareerMapStep } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

const PATHS = ["/skills", "/about"];

export async function createCareerMapStep(input: unknown): Promise<ActionResult<CareerMapStep>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(careerMapStepSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("career_map_steps")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not create step."));
  revalidatePublic(PATHS);
  return ok(data, "Step created.");
}

export async function updateCareerMapStep(
  id: string,
  input: unknown,
): Promise<ActionResult<CareerMapStep>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(careerMapStepSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("career_map_steps")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update step."));
  revalidatePublic(PATHS);
  return ok(data, "Step saved.");
}

export async function deleteCareerMapStep(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("career_map_steps").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete step."));
  revalidatePublic(PATHS);
  return ok(null, "Step deleted.");
}

export async function reorderCareerMapSteps(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("career_map_steps")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(PATHS);
  return ok(null, "Order saved.");
}

export async function toggleCareerMapStep(
  id: string,
  field: "is_visible",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "is_visible" ? { is_visible: value } : {};
  const { error } = await supabase.from("career_map_steps").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update step."));
  revalidatePublic(PATHS);
  return ok(null);
}
