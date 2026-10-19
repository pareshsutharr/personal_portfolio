import { revalidatePath } from "next/cache";
import { getPosts, getTags } from "@/lib/blog";
import { submitIndexNow } from "@/lib/indexnow";
import { purgeOldPageViews } from "@/lib/analytics";

export const dynamic = "force-dynamic";

/**
 * Monday cache refresh. Posts publish by date on their own; this makes sure the
 * pages that list them are rebuilt within minutes of 09:00 IST rather than on
 * the next visit after the hourly window. Scheduled by vercel.json.
 *
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` when that env var is set;
 * without it the route still runs, since all it does is drop caches.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") !== `Bearer ${secret}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const posts = await getPosts();
  const weekAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
  const recent = posts.filter((p) => new Date(p.date).getTime() >= weekAgo);

  const paths = ["/", "/blog", "/sitemap.xml", "/feed.xml", "/llms.txt", "/llms-full.txt"];
  for (const p of recent) {
    paths.push(`/blog/${p.slug}`, `/blog/${p.slug}/cover`, `/blog/${p.slug}/markdown`);
    for (const t of p.tags) paths.push(`/blog/tag/${t}`);
  }
  for (const path of paths) revalidatePath(path);

  // Tell Bing and friends about the new post and everything that lists it.
  const tags = await getTags();
  const indexNow = await submitIndexNow([
    "/",
    "/blog",
    "/sitemap.xml",
    ...recent.map((p) => `/blog/${p.slug}`),
    ...tags
      .filter((t) => recent.some((p) => p.tags.includes(t.tag)))
      .map((t) => `/blog/tag/${t.tag}`),
  ]);

  const purged = await purgeOldPageViews(180);

  return Response.json({
    ok: true,
    at: new Date().toISOString(),
    published: posts.length,
    indexNow,
    purged,
    refreshed: paths,
    latest: recent.map((p) => ({ slug: p.slug, date: p.date })),
  });
}
