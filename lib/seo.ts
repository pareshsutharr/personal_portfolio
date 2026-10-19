import type { Metadata } from "next";
import type { ProjectWithRelations } from "@/types";

/**
 * SEO helpers shared by public pages, the sitemap and the OG image route.
 * Every URL emitted here is absolute so pages do not depend on `metadataBase`.
 */

export const SITE_NAME = "Paresh Suthar";
export const DEFAULT_OG_PATH = "/opengraph-image";

export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/+$/, "");
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL ?? process.env.VERCEL_URL;
  // A localhost value is only ever right on a developer machine. On Vercel,
  // fall through to the deployment's own production hostname so canonical
  // URLs, Open Graph images and the sitemap never point at localhost.
  if (explicit && !(vercel && /localhost|127\.0\.0\.1/.test(explicit))) return explicit;
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return explicit || "http://localhost:3000";
}

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function pageMetadata({
  title,
  description,
  path,
  image,
  noIndex = false,
  type = "website",
}: {
  title: string;
  description?: string | null;
  path: string;
  image?: string | null;
  noIndex?: boolean;
  type?: "website" | "article";
}): Metadata {
  const url = absoluteUrl(path);
  const img = image ? absoluteUrl(image) : absoluteUrl(DEFAULT_OG_PATH);
  const desc = description ?? undefined;
  return {
    title,
    description: desc,
    alternates: { canonical: url },
    openGraph: {
      title,
      description: desc,
      url,
      siteName: SITE_NAME,
      type,
      images: [{ url: img, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc,
      images: [img],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

type JsonLd = Record<string, unknown>;

function compact<T extends JsonLd>(obj: T): T {
  const out: JsonLd = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === "") continue;
    if (Array.isArray(v) && v.length === 0) continue;
    out[k] = v;
  }
  return out as T;
}

export function personJsonLd({
  name,
  title,
  image,
  email,
  sameAs = [],
  location,
}: {
  name: string;
  title?: string | null;
  image?: string | null;
  email?: string | null;
  sameAs?: string[];
  location?: string | null;
}): JsonLd {
  return compact({
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    url: siteUrl(),
    jobTitle: title ?? undefined,
    image: image ?? undefined,
    email: email ? `mailto:${email}` : undefined,
    sameAs,
    address: location ? { "@type": "PostalAddress", addressLocality: location } : undefined,
  });
}

const MOBILE_PLATFORMS = /\b(ios|android|mobile)\b/i;

export function creativeWorkJsonLd(project: ProjectWithRelations): JsonLd {
  const isApp = project.platforms.some((p) => MOBILE_PLATFORMS.test(p));
  const summary = project.confidential && project.confidential_mode === "summary";
  const url = absoluteUrl(`/projects/${project.slug}`);
  const image = summary ? undefined : (project.og_image ?? project.cover_image ?? undefined);
  const base = compact({
    "@context": "https://schema.org",
    "@type": isApp ? "SoftwareApplication" : "CreativeWork",
    name: project.title,
    headline: project.title,
    description: project.meta_description ?? project.short_description ?? undefined,
    url,
    image,
    keywords: project.technologies.map((t) => t.name),
    genre: project.category ?? undefined,
    dateCreated: project.start_date ?? undefined,
    dateModified: project.updated_at,
    author: { "@type": "Person", name: SITE_NAME, url: siteUrl() },
  });
  if (isApp) {
    return compact({
      ...base,
      operatingSystem: project.platforms.join(", "),
      applicationCategory: project.category ?? undefined,
      installUrl: summary
        ? undefined
        : (project.app_store_url ?? project.play_store_url ?? undefined),
    });
  }
  return base;
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Serializes JSON-LD safely for inline <script> tags. */
export function serializeJsonLd(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
