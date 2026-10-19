"use server";

import { technologySchema } from "@/lib/validation/schemas";
import type { ActionResult, Technology } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

const PATHS = ["/projects", "/skills"];

export async function createTechnology(input: unknown): Promise<ActionResult<Technology>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(technologySchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("technologies")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not create technology."));
  revalidatePublic(PATHS);
  return ok(data, "Technology created.");
}

export async function updateTechnology(
  id: string,
  input: unknown,
): Promise<ActionResult<Technology>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(technologySchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("technologies")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not save technology."));
  revalidatePublic(PATHS);
  return ok(data, "Technology saved.");
}

/**
 * Deletes a technology. project_technologies rows cascade, so the UI confirms
 * with the usage count before calling this.
 */
export async function deleteTechnology(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("technologies").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete technology."));
  revalidatePublic(PATHS);
  return ok(null, "Technology deleted.");
}
