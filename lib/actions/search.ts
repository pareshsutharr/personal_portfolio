"use server";

import { z } from "zod";
import type { ActionResult, ProjectStatus } from "@/types";
import { dbError, fail, ok, requireAdmin } from "./helpers";

export type ProjectSearchHit = {
  id: string;
  title: string;
  slug: string;
  status: ProjectStatus;
};

const querySchema = z.string().trim().min(1).max(80);

/** Admin-only title search used by the command palette. Returns up to 8 hits. */
export async function searchProjects(q: string): Promise<ActionResult<ProjectSearchHit[]>> {
  const { supabase } = await requireAdmin();
  const parsed = querySchema.safeParse(q);
  if (!parsed.success) return ok([]);
  const term = parsed.data.replace(/[%_\\]/g, (c) => `\\${c}`);
  const { data, error } = await supabase
    .from("projects")
    .select("id,title,slug,status")
    .is("deleted_at", null)
    .ilike("title", `%${term}%`)
    .order("updated_at", { ascending: false })
    .limit(8);
  if (error) return fail(dbError(error, "Search failed."));
  return ok(data ?? []);
}
