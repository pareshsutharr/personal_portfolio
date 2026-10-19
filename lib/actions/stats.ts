"use server";

import { statSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, Stat } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

export async function createStat(input: unknown): Promise<ActionResult<Stat>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(statSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase.from("stats").insert(parsed.data).select("*").single();
  if (error) return fail(dbError(error, "Could not create stat."));
  revalidatePublic();
  return ok(data, "Stat created.");
}

export async function updateStat(id: string, input: unknown): Promise<ActionResult<Stat>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(statSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("stats")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update stat."));
  revalidatePublic();
  return ok(data, "Stat saved.");
}

export async function deleteStat(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("stats").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete stat."));
  revalidatePublic();
  return ok(null, "Stat deleted.");
}

export async function reorderStats(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("stats")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic();
  return ok(null, "Order saved.");
}

export async function toggleStat(
  id: string,
  field: "is_visible",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "is_visible" ? { is_visible: value } : {};
  const { error } = await supabase.from("stats").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update stat."));
  revalidatePublic();
  return ok(null);
}
