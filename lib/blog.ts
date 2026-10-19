import "server-only";

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { marked } from "marked";

/**
 * File-based blog. Posts live in content/blog/*.md with frontmatter.
 *
 * Scheduling: a post is public once its `date` has passed. Pages that list
 * posts revalidate hourly, so a post dated next Monday 09:00 IST appears that
 * morning without a deploy or a cron job.
 */
export type Post = {
  slug: string;
  title: string;
  description: string;
  /** ISO timestamp the post goes live. */
  date: string;
  updated: string | null;
  tags: string[];
  /** Extra phrases for the meta keywords and structured data. */
  keywords: string[];
  /** Project slug this post relates to, if any. */
  project: string | null;
  readingMinutes: number;
  html: string;
  /** Plain-text body, for the RSS description and search snippets. */
  text: string;
};

const DIR = path.join(process.cwd(), "content", "blog");
const WORDS_PER_MINUTE = 220;

marked.setOptions({ gfm: true, breaks: false });

function toIso(value: unknown): string | null {
  if (!value) return null;
  const d = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

function stripMarkdown(md: string) {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_~-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readPost(file: string): Promise<Post | null> {
  const raw = await readFile(path.join(DIR, file), "utf8");
  const { data, content } = matter(raw);
  const date = toIso(data.date);
  if (!data.title || !date) return null;
  const text = stripMarkdown(content);
  const words = text.split(" ").filter(Boolean).length;
  return {
    slug: (data.slug as string | undefined) ?? file.replace(/\.md$/, ""),
    title: String(data.title),
    description: String(data.description ?? ""),
    date,
    updated: toIso(data.updated),
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    project: data.project ? String(data.project) : null,
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    html: marked.parse(content, { async: false }) as string,
    text,
  };
}

let cache: { at: number; posts: Post[] } | null = null;

/** All posts, newest first. Scheduled (future-dated) posts are excluded unless asked for. */
export async function getPosts(opts: { includeScheduled?: boolean } = {}): Promise<Post[]> {
  if (!cache || Date.now() - cache.at > 60_000) {
    let files: string[] = [];
    try {
      files = (await readdir(DIR)).filter((f) => f.endsWith(".md") && !f.startsWith("_"));
    } catch {
      files = [];
    }
    const posts = (await Promise.all(files.map(readPost))).filter((p): p is Post => p !== null);
    posts.sort((a, b) => b.date.localeCompare(a.date));
    cache = { at: Date.now(), posts };
  }
  const now = new Date().toISOString();
  return opts.includeScheduled ? cache.posts : cache.posts.filter((p) => p.date <= now);
}

export async function getPost(slug: string): Promise<Post | null> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

/** Up to `limit` other posts sharing a tag, newest first. */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const posts = await getPosts();
  return posts
    .filter((p) => p.slug !== post.slug && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, limit);
}
