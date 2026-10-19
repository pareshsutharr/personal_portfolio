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
/** A real photograph shown with the post, with the attribution its licence asks for. */
export type PostImage = {
  src: string;
  alt: string;
  credit: string;
  creditUrl: string | null;
  license: string | null;
};

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
  /** Optional real photo (URL or /public path) that replaces the generated cover. */
  cover: string | null;
  /** Stock photo for the post page, lists and admin. Falls back to the generated cover. */
  image: PostImage | null;
  /** Two-sentence direct answer shown as "In short" and used as the abstract. */
  summary: string | null;
  /** Short questions and answers rendered at the end of the post, with FAQPage schema. */
  faq: { q: string; a: string }[];
  readingMinutes: number;
  /** Raw Markdown body, served at /blog/<slug>.md for readers and AI agents. */
  markdown: string;
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
    cover: data.cover ? String(data.cover) : null,
    image: data.image
      ? {
          src: String(data.image),
          alt: String(data.imageAlt ?? ""),
          credit: String(data.imageCredit ?? "Unknown"),
          creditUrl: data.imageCreditUrl ? String(data.imageCreditUrl) : null,
          license: data.imageLicense ? String(data.imageLicense) : null,
        }
      : null,
    summary: data.summary ? String(data.summary) : null,
    faq: Array.isArray(data.faq)
      ? data.faq
          .filter(
            (f: unknown): f is { q: unknown; a: unknown } =>
              !!f && typeof f === "object" && "q" in f && "a" in f,
          )
          .map((f) => ({ q: String(f.q), a: String(f.a) }))
      : [],
    readingMinutes: Math.max(1, Math.round(words / WORDS_PER_MINUTE)),
    html: marked.parse(content, { async: false }) as string,
    text,
    markdown: content.trim(),
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

/** The image to show for a post: its own cover if set, else the generated one. */
export function postCoverPath(post: Pick<Post, "slug" | "cover">) {
  return post.cover ?? `/blog/${post.slug}/cover`;
}

/** The photo to show in lists and at the top of a post: the stock image, else the generated cover. */
export function postImagePath(post: Pick<Post, "slug" | "cover" | "image">) {
  return post.image?.src ?? postCoverPath(post);
}

export async function getPost(slug: string): Promise<Post | null> {
  const posts = await getPosts();
  return posts.find((p) => p.slug === slug) ?? null;
}

/** Display names for tags whose slug is not just a lowercased word. */
const TAG_LABELS: Record<string, string> = {
  nodejs: "Node.js",
  mongodb: "MongoDB",
  nextjs: "Next.js",
  seo: "SEO",
  hrms: "HRMS",
  crm: "CRM",
  jwt: "JWT",
  pm2: "PM2",
  api: "APIs",
  devops: "DevOps",
  vps: "VPS",
  ci: "CI",
  ux: "UX",
  pdf: "PDF",
  s3: "S3",
  aws: "AWS",
  dns: "DNS",
  http: "HTTP",
  totp: "TOTP",
  otp: "OTP",
  e2e: "E2E testing",
  i18n: "i18n",
  css: "CSS",
  sql: "SQL",
  owasp: "OWASP",
  rbac: "RBAC",
  ssl: "SSL",
  rls: "RLS",
  oauth: "OAuth",
  csp: "CSP",
  intl: "Intl",
  excel: "Excel",
  redis: "Redis",
  nginx: "Nginx",
  postgres: "Postgres",
  typescript: "TypeScript",
  javascript: "JavaScript",
  tailwind: "Tailwind CSS",
  threejs: "Three.js",
  capacitor: "Capacitor",
  supabase: "Supabase",
  react: "React",
  express: "Express",
  sentry: "Sentry",
  zod: "Zod",
  "dnd-kit": "dnd-kit",
  cmdk: "cmdk",
  pg_cron: "pg_cron",
  "react-query": "React Query",
  "core-web-vitals": "Core Web Vitals",
  "github-actions": "GitHub Actions",
  "feature-flags": "Feature flags",
  "design-system": "Design systems",
  "data-modeling": "Data modelling",
  "server-actions": "Server actions",
  "rate-limiting": "Rate limiting",
  "case-study": "Case studies",
  "growth-avenues": "Growth Avenues",
};

export function tagLabel(tag: string) {
  return TAG_LABELS[tag] ?? tag.charAt(0).toUpperCase() + tag.slice(1).replace(/-/g, " ");
}

/** One paragraph for the hub page of the tags with the most posts. */
const TAG_INTROS: Record<string, string> = {
  nodejs:
    "Node.js in production: Express APIs, PM2, error handling, uploads, PDFs, exports, scheduled jobs and the memory leaks in between. Every post comes from a server I run for a client.",
  mongodb:
    "MongoDB as the main database for an HRMS, a CRM and a client portal: schema design, indexes, slow queries, migrations, soft deletes, backups and restores, all on a self-hosted VPS.",
  nextjs:
    "Next.js App Router in practice: caching, server actions, protected routes, ISR, metadata and SEO, image pipelines and the hydration errors that only show up on phones.",
  react:
    "React patterns from admin dashboards and client portals: forms, optimistic UI, drag and drop, command palettes, accessibility, animation and the tests that cover them.",
  security:
    "Security for small-team web apps: authentication, sessions and JWTs, password resets, two-factor, rate limiting, security headers, audit logs and the OWASP list applied to a MERN stack.",
  deployment:
    "Deploying and running Node.js apps on a Linux VPS: Nginx, PM2, SSL, Docker, CI, staging, monitoring, backups and the recovery drill that proves the backups work.",
  supabase:
    "Supabase on a Next.js site: row-level security, server actions, full-text search, Realtime, pg_cron and the mistakes the advisor catches.",
  capacitor:
    "Turning a React web app into Android and iOS apps with Capacitor: CORS, cookies, push notifications and updating the app without a store release.",
  seo: "Search for a developer portfolio: technical SEO on Next.js, structured data, a custom domain, a scheduled blog and the honest numbers after a year and two.",
  freelancing:
    "Freelance development as a business: estimating, contracts, case studies, handing projects over and the pricing that keeps a one-person shop solvent.",
  hrms: "Building an HR system for a 300-person company: attendance, biometric devices, leave approvals, salary slips, audit logs, soft deletes and the schema that holds it together.",
  crm: "A lead desk and CRM for a sales floor: statuses, assignment, search, a kanban board, live updates and not losing enquiries.",
  performance:
    "Making pages fast and keeping them fast: Core Web Vitals, Lighthouse, image pipelines, caching at every layer and finding the leak in a Node process.",
  express:
    "Express in production: routing, validation with Zod, error handling, rate limiting, auth middleware, webhooks and OpenAPI docs generated from the schemas.",
  auth: "Authentication done carefully: JWTs and sessions, role-based access, OAuth, password resets, OTP and TOTP, brute-force protection and revoking access when roles change.",
  testing:
    "Tests that earn their keep: API tests against a real database, animated components under reduced motion, and a small Playwright suite for the flows that must not break.",
  linux:
    "Linux servers for small products: Nginx, systemd timers, cron, firewalls, disk and uptime monitoring, caching and rebuilding the whole box from a script.",
  nginx:
    "Nginx in front of Node: reverse proxying several apps on one server, SSL, caching static assets and API responses, rate limiting and staging on a subdomain.",
};

export function tagIntro(tag: string, count: number) {
  return (
    TAG_INTROS[tag] ??
    `${count} ${count === 1 ? "post" : "posts"} about ${tagLabel(tag)} from real projects, with code and sources.`
  );
}

export type TagSummary = { tag: string; label: string; count: number };

/** Every tag on published posts with its post count, most used first. */
export async function getTags(): Promise<TagSummary[]> {
  const posts = await getPosts();
  const counts = new Map<string, number>();
  for (const p of posts) for (const t of p.tags) counts.set(t, (counts.get(t) ?? 0) + 1);
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, label: tagLabel(tag), count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}

export async function getPostsByTag(tag: string): Promise<Post[]> {
  const posts = await getPosts();
  return posts.filter((p) => p.tags.includes(tag));
}

/** Up to `limit` other posts sharing a tag, newest first. */
export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const posts = await getPosts();
  return posts
    .filter((p) => p.slug !== post.slug && p.tags.some((t) => post.tags.includes(t)))
    .slice(0, limit);
}
