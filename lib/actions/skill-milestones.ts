"use server";

import { skillMilestoneSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, SkillMilestone } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

const PATHS = ["/skills", "/about"];

export async function createSkillMilestone(input: unknown): Promise<ActionResult<SkillMilestone>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(skillMilestoneSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("skill_milestones")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not create milestone."));
  revalidatePublic(PATHS);
  return ok(data, "Milestone created.");
}

export async function updateSkillMilestone(
  id: string,
  input: unknown,
): Promise<ActionResult<SkillMilestone>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(skillMilestoneSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("skill_milestones")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update milestone."));
  revalidatePublic(PATHS);
  return ok(data, "Milestone saved.");
}

export async function deleteSkillMilestone(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("skill_milestones").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete milestone."));
  revalidatePublic(PATHS);
  return ok(null, "Milestone deleted.");
}

export async function reorderSkillMilestones(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("skill_milestones")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(PATHS);
  return ok(null, "Order saved.");
}

export async function toggleSkillMilestone(
  id: string,
  field: "is_visible",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "is_visible" ? { is_visible: value } : {};
  const { error } = await supabase.from("skill_milestones").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update milestone."));
  revalidatePublic(PATHS);
  return ok(null);
}
