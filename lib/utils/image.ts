/**
 * next/image only optimizes hosts whitelisted in next.config.ts (Supabase
 * storage). Anything else must be rendered `unoptimized` or it throws.
 */
export function isOptimizableImage(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes("/storage/v1/object/public/");
}

/** Up to two uppercase initials from a title: "Growth Avenues" → "GA". */
export function initials(title: string): string {
  const words = title
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "–";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}
