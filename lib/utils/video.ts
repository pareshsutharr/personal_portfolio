export type VideoEmbed =
  | { kind: "youtube"; id: string; embedUrl: string; thumbnail: string }
  | { kind: "vimeo"; id: string; embedUrl: string; thumbnail: null }
  | { kind: "file"; embedUrl: string; thumbnail: null }
  | { kind: "link"; embedUrl: null; thumbnail: null };

/** Detects YouTube / Vimeo / direct video files from a pasted URL. */
export function parseVideoUrl(raw: string): VideoEmbed {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { kind: "link", embedUrl: null, thumbnail: null };
  }
  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be" || host.endsWith("youtube.com") || host === "youtube-nocookie.com") {
    let id: string | null = null;
    if (host === "youtu.be") id = url.pathname.slice(1).split("/")[0];
    else if (url.pathname.startsWith("/shorts/")) id = url.pathname.split("/")[2];
    else if (url.pathname.startsWith("/embed/")) id = url.pathname.split("/")[2];
    else id = url.searchParams.get("v");
    if (id) {
      return {
        kind: "youtube",
        id,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`,
        thumbnail: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
      };
    }
  }

  if (host === "vimeo.com" || host === "player.vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean).pop();
    if (id && /^\d+$/.test(id)) {
      return {
        kind: "vimeo",
        id,
        embedUrl: `https://player.vimeo.com/video/${id}?autoplay=1`,
        thumbnail: null,
      };
    }
  }

  if (/\.(mp4|webm|mov|m4v)(\?.*)?$/i.test(url.pathname + url.search)) {
    return { kind: "file", embedUrl: raw, thumbnail: null };
  }

  return { kind: "link", embedUrl: null, thumbnail: null };
}
