import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";
import { getPosts, getTags } from "@/lib/blog";
import { getNowPage, getProjectSlugs, getSiteSettings } from "@/lib/queries/public";

/** Rebuilt hourly so a post that goes live on its date is listed without a deploy. */
export const revalidate = 3600;

const STATIC_ROUTES: { path: string; priority: number; changeFrequency: "weekly" | "monthly" }[] = [
  { path: "/", priority: 1, changeFrequency: "weekly" },
  { path: "/projects", priority: 0.9, changeFrequency: "weekly" },
  { path: "/about", priority: 0.8, changeFrequency: "monthly" },
  { path: "/experience", priority: 0.7, changeFrequency: "monthly" },
  { path: "/skills", priority: 0.7, changeFrequency: "monthly" },
  { path: "/services", priority: 0.7, changeFrequency: "monthly" },
  { path: "/certifications", priority: 0.5, changeFrequency: "monthly" },
  { path: "/resume", priority: 0.5, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/blog", priority: 0.8, changeFrequency: "weekly" },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [slugs, settings, now, posts, tags] = await Promise.all([
    getProjectSlugs(),
    getSiteSettings(),
    getNowPage(),
    getPosts(),
    getTags(),
  ]);

  const entries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
    url: absoluteUrl(r.path),
    priority: r.priority,
    changeFrequency: r.changeFrequency,
  }));

  if (settings?.show_now_page && now) {
    entries.push({
      url: absoluteUrl("/now"),
      lastModified: now.updated_at,
      priority: 0.4,
      changeFrequency: "weekly",
    });
  }

  for (const p of slugs) {
    entries.push({
      url: absoluteUrl(`/projects/${p.slug}`),
      lastModified: p.updated_at,
      priority: 0.8,
      changeFrequency: "monthly",
    });
  }

  for (const p of posts) {
    entries.push({
      url: absoluteUrl(`/blog/${p.slug}`),
      lastModified: p.updated ?? p.date,
      priority: 0.7,
      changeFrequency: "monthly",
    });
  }

  for (const t of tags) {
    const latest = posts.find((p) => p.tags.includes(t.tag));
    entries.push({
      url: absoluteUrl(`/blog/tag/${t.tag}`),
      lastModified: latest?.updated ?? latest?.date,
      priority: 0.6,
      changeFrequency: "weekly",
    });
  }

  return entries;
}
