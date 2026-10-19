import "server-only";

import { getPosts, getTags } from "@/lib/blog";
import { getProfile, getServices } from "@/lib/queries/public";
import { absoluteUrl } from "@/lib/seo";

/**
 * llms.txt: a Markdown map of the site for AI assistants and crawlers.
 * Only published posts are listed, so scheduled titles never leak.
 */
export async function llmsIndex() {
  const [posts, tags, profile, services] = await Promise.all([
    getPosts(),
    getTags(),
    getProfile(),
    getServices(),
  ]);
  const lines = [
    "# Paresh Suthar",
    "",
    "> Full stack software engineer in Surat, Gujarat, India. React, Next.js, Node.js, Express, MongoDB, Postgres and Supabase; Linux servers with Nginx and PM2; Android and iOS apps with Capacitor. Works on the Growth Avenues broking platform and takes freelance projects.",
    "",
    profile?.what_i_build ? `${profile.what_i_build}\n` : null,
    `Contact: ${profile?.email ?? "see the contact page"} · ${absoluteUrl("/contact")}`,
    "",
    "## Pages",
    "",
    `- [About](${absoluteUrl("/about")}): background, education, how I work`,
    `- [Services](${absoluteUrl("/services")}): what I build and how I charge`,
    `- [Projects](${absoluteUrl("/projects")}): case studies with outcomes`,
    `- [Experience](${absoluteUrl("/experience")}): roles and dates`,
    `- [Skills](${absoluteUrl("/skills")})`,
    `- [Blog](${absoluteUrl("/blog")}): one post every Monday from real projects, with code and sources`,
    `- [RSS](${absoluteUrl("/feed.xml")}) · [Sitemap](${absoluteUrl("/sitemap.xml")}) · [Full text of every post](${absoluteUrl("/llms-full.txt")})`,
    "",
    services.length ? "## Services" : null,
    services.length ? "" : null,
    ...services.map((s) => `- ${s.title}${s.description ? `: ${s.description}` : ""}`),
    services.length ? "" : null,
    "## Topics",
    "",
    ...tags
      .filter((t) => t.count >= 2)
      .map((t) => `- [${t.label}](${absoluteUrl(`/blog/tag/${t.tag}`)}) (${t.count})`),
    "",
    "## Posts",
    "",
    "Each post also exists as plain Markdown at the same URL with `.md` appended.",
    "",
    ...posts.map((p) => `- [${p.title}](${absoluteUrl(`/blog/${p.slug}`)}): ${p.description}`),
    "",
  ].filter((l): l is string => l !== null);
  return lines.join("\n");
}

/** llms-full.txt: every published post in full, newest first. */
export async function llmsFull() {
  const posts = await getPosts();
  const parts = [await llmsIndex(), "", "---", ""];
  for (const p of posts) {
    parts.push(
      `# ${p.title}`,
      "",
      `Source: ${absoluteUrl(`/blog/${p.slug}`)} · Published ${p.date.slice(0, 10)} · Tags: ${p.tags.join(", ")}`,
      "",
      p.summary ? `In short: ${p.summary}\n` : "",
      p.markdown,
      "",
      ...(p.faq.length
        ? ["## Questions people ask", "", ...p.faq.flatMap((f) => [`**${f.q}**`, "", f.a, ""])]
        : []),
      "---",
      "",
    );
  }
  return parts.join("\n");
}
