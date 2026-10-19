"use server";

import { projectFeatureSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, ProjectFeature } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

export async function createProjectFeature(input: unknown): Promise<ActionResult<ProjectFeature>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(projectFeatureSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("project_features")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not add feature."));
  revalidatePublic(["/projects"]);
  return ok(data, "Feature added.");
}

export async function updateProjectFeature(
  id: string,
  input: unknown,
): Promise<ActionResult<ProjectFeature>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(projectFeatureSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("project_features")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not save feature."));
  revalidatePublic(["/projects"]);
  return ok(data, "Feature saved.");
}

export async function deleteProjectFeature(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("project_features").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete feature."));
  revalidatePublic(["/projects"]);
  return ok(null, "Feature deleted.");
}

export async function reorderProjectFeatures(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("project_features")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder features."));
  revalidatePublic(["/projects"]);
  return ok(null, "Order saved.");
}
