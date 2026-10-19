"use server";

import { videoSchema } from "@/lib/validation/schemas";
import { reorderSchema } from "@/lib/validation/common";
import type { ActionResult, Video } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

const PATHS = ["/experience"];

export async function createVideo(input: unknown): Promise<ActionResult<Video>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(videoSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase.from("videos").insert(parsed.data).select("*").single();
  if (error) return fail(dbError(error, "Could not add video."));
  revalidatePublic(PATHS);
  return ok(data, "Video added.");
}

export async function updateVideo(id: string, input: unknown): Promise<ActionResult<Video>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(videoSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("videos")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update video."));
  revalidatePublic(PATHS);
  return ok(data, "Video saved.");
}

export async function deleteVideo(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("videos").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete video."));
  revalidatePublic(PATHS);
  return ok(null, "Video removed.");
}

export async function reorderVideos(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("videos")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(PATHS);
  return ok(null, "Order saved.");
}

export async function toggleVideo(
  id: string,
  field: "is_visible",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "is_visible" ? { is_visible: value } : {};
  const { error } = await supabase.from("videos").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update video."));
  revalidatePublic(PATHS);
  return ok(null);
}
