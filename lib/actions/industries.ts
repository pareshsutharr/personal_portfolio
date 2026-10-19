"use server";

import { industrySchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, Industry } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

const PATHS = ["/", "/projects"];

export async function createIndustry(input: unknown): Promise<ActionResult<Industry>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(industrySchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("industries")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not create industry."));
  revalidatePublic(PATHS);
  return ok(data, "Industry created.");
}

export async function updateIndustry(id: string, input: unknown): Promise<ActionResult<Industry>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(industrySchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("industries")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not save industry."));
  revalidatePublic(PATHS);
  return ok(data, "Industry saved.");
}

/** Projects referencing the industry keep working: industry_id is set to null. */
export async function deleteIndustry(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("industries").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete industry."));
  revalidatePublic(PATHS);
  return ok(null, "Industry deleted.");
}

export async function reorderIndustries(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("industries")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(PATHS);
  return ok(null, "Order saved.");
}

export async function toggleIndustry(id: string, value: boolean): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("industries").update({ is_visible: value }).eq("id", id);
  if (error) return fail(dbError(error, "Could not update industry."));
  revalidatePublic(PATHS);
  return ok(null);
}
