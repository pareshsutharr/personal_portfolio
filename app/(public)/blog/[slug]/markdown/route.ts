import { getPost } from "@/lib/blog";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

/**
 * The post as plain Markdown, served at /blog/<slug>.md (rewritten here in
 * next.config). Readers can save it; AI crawlers and agents prefer it to HTML.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return new Response("Not found", { status: 404 });
  const head = [
    `# ${post.title}`,
    "",
    `> ${post.description}`,
    "",
    `- Author: Paresh Suthar (${absoluteUrl("/about")})`,
    `- Published: ${post.date.slice(0, 10)}${post.updated ? ` · Updated: ${post.updated.slice(0, 10)}` : ""}`,
    `- Canonical: ${absoluteUrl(`/blog/${post.slug}`)}`,
    `- Tags: ${post.tags.join(", ")}`,
    post.summary ? `- In short: ${post.summary}` : null,
    "",
    "---",
    "",
  ].filter((l): l is string => l !== null);
  const faq = post.faq.length
    ? ["", "## Questions people ask", "", ...post.faq.flatMap((f) => [`**${f.q}**`, "", f.a, ""])]
    : [];
  return new Response([...head, post.markdown, ...faq, ""].join("\n"), {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Robots-Tag": "noindex",
      "Cache-Control": "public, max-age=0, s-maxage=3600",
    },
  });
}
