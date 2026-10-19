import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { getSeoSettings } from "@/lib/queries/public";
import { siteUrl } from "@/lib/seo";

export const alt = "Paresh Suthar — Full Stack Software Engineer";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const revalidate = 3600;

const FALLBACK_TITLE = "Full Stack Software Engineer";

// Brand mark, inlined so the route has no network dependency at render time.
const logoMark = `data:image/png;base64,${(
  await readFile(join(process.cwd(), "public/logo-mark.png"))
).toString("base64")}`;
const FALLBACK_DESCRIPTION =
  "Full-stack developer in Surat, India. React, Node.js, MongoDB and Postgres.";

export default async function OpenGraphImage() {
  let title = FALLBACK_TITLE;
  let description = FALLBACK_DESCRIPTION;
  try {
    const seo = await getSeoSettings();
    if (seo?.og_title) title = seo.og_title;
    else if (seo?.site_title) title = seo.site_title;
    if (seo?.og_description) description = seo.og_description;
    else if (seo?.meta_description) description = seo.meta_description;
  } catch {
    // Settings unavailable: render the static fallback.
  }
  // Strip the name from the title so it does not appear twice.
  title = title.replace(/paresh suthar\s*[—–\-|:]?\s*/i, "").trim() || FALLBACK_TITLE;
  const host = siteUrl().replace(/^https?:\/\//, "");

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#050505",
        backgroundImage:
          "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
        backgroundSize: "80px 80px",
        color: "#e7e7e7",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: 20,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "#8a8a8a",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <img src={logoMark} width={56} height={56} alt="" style={{ display: "flex" }} />
          <span>Portfolio</span>
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "#e8521f",
              display: "flex",
            }}
          />
          {host}
        </span>
      </div>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <div
          style={{
            fontSize: 128,
            fontWeight: 700,
            letterSpacing: "-0.05em",
            lineHeight: 0.92,
            color: "#ffffff",
            display: "flex",
          }}
        >
          PARESH SUTHAR
        </div>
        <div
          style={{
            marginTop: 36,
            width: 160,
            height: 4,
            background: "#e8521f",
            display: "flex",
          }}
        />
        <div
          style={{
            marginTop: 32,
            fontSize: 44,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "#e7e7e7",
            display: "flex",
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 24,
            lineHeight: 1.4,
            color: "#a0a0a0",
            maxWidth: 900,
            display: "flex",
          }}
        >
          {description}
        </div>
      </div>
    </div>,
    { ...size },
  );
}
