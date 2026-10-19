"use server";

import { z } from "zod";
import { projectImageSchema } from "@/lib/validation/schemas";
import { optionalText, reorderSchema } from "@/lib/validation/common";
import type { ActionResult, ProjectImage } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

/** Metadata edits for an existing gallery image (URL and project are fixed). */
const projectImageMetaSchema = z.object({
  alt_text: optionalText,
  caption: optionalText,
  type: z.enum(["hero", "screenshot", "dashboard", "mobile", "architecture", "gallery"]),
});

export async function addProjectImage(input: unknown): Promise<ActionResult<ProjectImage>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(projectImageSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("project_images")
    .insert(parsed.data)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not add image."));
  revalidatePublic(["/projects"]);
  return ok(data, "Image added.");
}

export async function updateProjectImage(
  id: string,
  input: unknown,
): Promise<ActionResult<ProjectImage>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(projectImageMetaSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("project_images")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not save image."));
  revalidatePublic(["/projects"]);
  return ok(data, "Image saved.");
}

/** Removes the gallery row only; the file stays in the media library. */
export async function removeProjectImage(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("project_images").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not remove image."));
  revalidatePublic(["/projects"]);
  return ok(null, "Image removed.");
}

export async function reorderProjectImages(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("project_images")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder images."));
  revalidatePublic(["/projects"]);
  return ok(null, "Order saved.");
}
