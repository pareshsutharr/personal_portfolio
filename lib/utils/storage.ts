export const MEDIA_BUCKET = "media";

export type MediaFolder =
  "profile" | "projects" | "certificates" | "logos" | "travel" | "resume" | "og" | "general";

export const MEDIA_FOLDERS: MediaFolder[] = [
  "profile",
  "projects",
  "certificates",
  "logos",
  "travel",
  "resume",
  "og",
  "general",
];

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
export const PDF_MIME_TYPES = ["application/pdf"];
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
export const MAX_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

/** Public URL for an object path inside the media bucket. */
export function publicMediaUrl(path: string) {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  return `${base}/storage/v1/object/public/${MEDIA_BUCKET}/${path}`;
}

/** Extracts the object path from a public media URL (or returns null). */
export function pathFromMediaUrl(url: string | null | undefined) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${MEDIA_BUCKET}/`;
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

/** Clean, unique object name: folder/yyyy-mm/slug-<rand>.ext */
export function buildObjectPath(folder: MediaFolder, originalName: string) {
  const ext = (originalName.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
  const base =
    originalName
      .replace(/\.[^.]+$/, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48) || "file";
  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const rand = Math.random().toString(36).slice(2, 8);
  return `${folder}/${ym}/${base}-${rand}.${ext}`;
}
