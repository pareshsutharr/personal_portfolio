"use server";

import { z } from "zod";
import {
  IMAGE_MIME_TYPES,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  MEDIA_BUCKET,
  MEDIA_FOLDERS,
  PDF_MIME_TYPES,
  buildObjectPath,
  pathFromMediaUrl,
  type MediaFolder,
} from "@/lib/utils/storage";
import { mediaUpdateSchema } from "@/lib/validation/schemas";
import type { ActionResult, Media } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

const folderSchema = z.enum(MEDIA_FOLDERS as [MediaFolder, ...MediaFolder[]]);

/**
 * Uploads one file (image or PDF) to Supabase Storage as the signed-in admin
 * and records it in the media library. Returns the media row.
 */
export async function uploadMedia(formData: FormData): Promise<ActionResult<Media>> {
  const { supabase } = await requireAdmin();

  const file = formData.get("file");
  const folderRaw = formData.get("folder") ?? "general";
  const altText = (formData.get("alt_text") as string | null)?.trim() || null;

  if (!(file instanceof File) || file.size === 0) return fail("Choose a file to upload.");
  const folder = folderSchema.safeParse(folderRaw);
  if (!folder.success) return fail("Invalid folder.");

  const isImage = IMAGE_MIME_TYPES.includes(file.type);
  const isPdf = PDF_MIME_TYPES.includes(file.type);
  if (!isImage && !isPdf) return fail("Only JPEG, PNG, WEBP, SVG and PDF files are allowed.");
  if (isImage && file.size > MAX_IMAGE_BYTES) return fail("Images must be 5 MB or smaller.");
  if (isPdf && file.size > MAX_PDF_BYTES) return fail("PDFs must be 10 MB or smaller.");
  if (isPdf && folder.data !== "resume" && folder.data !== "general")
    return fail("PDFs belong in the resume or general folder.");

  const path = buildObjectPath(folder.data, file.name);
  const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(path, file, {
    contentType: file.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) return fail(uploadError.message);

  const { data: pub } = supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path);

  const width = Number(formData.get("width")) || null;
  const height = Number(formData.get("height")) || null;

  const { data, error } = await supabase
    .from("media")
    .insert({
      bucket: MEDIA_BUCKET,
      path,
      url: pub.publicUrl,
      filename: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      width,
      height,
      alt_text: altText,
      folder: folder.data,
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from(MEDIA_BUCKET).remove([path]);
    return fail(dbError(error, "Upload saved to storage but failed to index."));
  }
  return ok(data, "Uploaded.");
}

export async function updateMedia(id: string, input: unknown): Promise<ActionResult<Media>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(mediaUpdateSchema, input);
  if (!parsed.ok) return parsed.result;
  const { data, error } = await supabase
    .from("media")
    .update(parsed.data)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not update media."));
  return ok(data, "Saved.");
}

/** Deletes the storage object and its library row. */
export async function deleteMedia(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { data: row } = await supabase.from("media").select("path").eq("id", id).maybeSingle();
  if (!row) return fail("Media not found.");
  const { error: storageError } = await supabase.storage.from(MEDIA_BUCKET).remove([row.path]);
  if (storageError) return fail(storageError.message);
  const { error } = await supabase.from("media").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete media."));
  revalidatePublic();
  return ok(null, "Deleted.");
}

/** Deletes by public URL; used when replacing an image from an entity form. */
export async function deleteMediaByUrl(url: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const path = pathFromMediaUrl(url);
  if (!path) return fail("Not a media URL.");
  await supabase.storage.from(MEDIA_BUCKET).remove([path]);
  await supabase.from("media").delete().eq("path", path);
  return ok(null, "Deleted.");
}

export async function listMedia(opts?: {
  folder?: MediaFolder | "all";
  search?: string;
  limit?: number;
}): Promise<ActionResult<Media[]>> {
  const { supabase } = await requireAdmin();
  let q = supabase.from("media").select("*").order("created_at", { ascending: false });
  if (opts?.folder && opts.folder !== "all") q = q.eq("folder", opts.folder);
  if (opts?.search) q = q.or(`filename.ilike.%${opts.search}%,alt_text.ilike.%${opts.search}%`);
  q = q.limit(opts?.limit ?? 200);
  const { data, error } = await q;
  if (error) return fail(dbError(error, "Could not load media."));
  return ok(data ?? []);
}
