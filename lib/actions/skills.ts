"use server";

import { skillSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, Skill } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

const PATHS = ["/skills", "/"];

export async function createSkill(input: unknown): Promise<ActionResult<Skill>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(skillSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase.from("skills").insert(parsed.data).select("*").single();
  if (error) return fail(dbError(error, "Could not create skill."));
  revalidatePublic(PATHS);
  return ok(data, "Skill created.");
}

export async function updateSkill(id: string, input: unknown): Promise<ActionResult<Skill>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(skillSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("skills")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update skill."));
  revalidatePublic(PATHS);
  return ok(data, "Skill saved.");
}

export async function deleteSkill(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("skills").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete skill."));
  revalidatePublic(PATHS);
  return ok(null, "Skill deleted.");
}

export async function reorderSkills(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("skills")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(PATHS);
  return ok(null, "Order saved.");
}

export async function toggleSkill(
  id: string,
  field: "is_visible" | "is_featured",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "is_featured" ? { is_featured: value } : { is_visible: value };
  const { error } = await supabase.from("skills").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update skill."));
  revalidatePublic(PATHS);
  return ok(null);
}
