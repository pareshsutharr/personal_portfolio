import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getPost } from "@/lib/blog";

const size = { width: 1200, height: 630 };
export const revalidate = 3600;

// Brand mark, inlined so the route has no network dependency at render time.
const logoMark = `data:image/png;base64,${(
  await readFile(join(process.cwd(), "public/logo-mark.png"))
).toString("base64")}`;

const ACCENTS: Record<string, string> = {
  nodejs: "#3c873a",
  mongodb: "#47a248",
  react: "#61dafb",
  nextjs: "#e7e7e7",
  nginx: "#009639",
  security: "#ef4b5f",
  seo: "#f5a524",
  capacitor: "#119eff",
  supabase: "#3ecf8e",
  fintech: "#e8521f",
};

/**
 * Generated cover for every post: title, tags and the brand mark on the site's
 * black, with an accent glow picked from the first recognised tag. Used as the
 * Open Graph image and as the header image on the post page and list.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  // Unknown or not-yet-published posts get no cover, so scheduled titles never leak.
  if (!post) return new Response("Not found", { status: 404 });
  const title = post.title;
  const tags = post.tags;
  const accent = tags.map((t) => ACCENTS[t]).find(Boolean) ?? "#e8521f";
  const date = new Date(post.date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
  const fontSize = title.length > 70 ? 52 : title.length > 45 ? 62 : 74;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "60px 68px",
        background: "#050505",
        backgroundImage: `radial-gradient(900px 500px at 100% 0%, ${accent}33, transparent 60%), linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)`,
        backgroundSize: "100% 100%, 80px 80px, 80px 80px",
        color: "#e7e7e7",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- satori JSX, next/image does not apply */}
          <img src={logoMark} width={56} height={56} alt="" style={{ display: "flex" }} />
          <span
            style={{
              fontSize: 22,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#8a8a8a",
            }}
          >
            Paresh Suthar · Blog
          </span>
        </div>
        <span style={{ fontSize: 22, letterSpacing: "0.12em", color: "#8a8a8a" }}>{date}</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        <div style={{ width: 120, height: 5, background: accent, display: "flex" }} />
        <div
          style={{
            fontSize,
            fontWeight: 700,
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            color: "#ffffff",
            display: "flex",
            maxWidth: 1040,
          }}
        >
          {title}
        </div>
        {tags.length ? (
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {tags.slice(0, 5).map((t) => (
              <span
                key={t}
                style={{
                  display: "flex",
                  padding: "8px 16px",
                  border: "1px solid #2a2a2a",
                  borderRadius: 6,
                  fontSize: 22,
                  color: "#a0a0a0",
                  letterSpacing: "0.06em",
                }}
              >
                #{t}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    { ...size },
  );
}
