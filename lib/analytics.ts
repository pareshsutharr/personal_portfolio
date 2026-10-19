import "server-only";

import { createHmac } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

/**
 * First-party, cookie-free page analytics.
 *
 * Nothing identifies a person: the visitor id is an HMAC of day, IP and user
 * agent under a server secret, so the same device counts once per day and no
 * two days can be joined. Rows are written by the hit endpoint with the
 * service role and read only by the admin.
 */

export type PageViewInsert = Database["public"]["Tables"]["page_views"]["Insert"];
type PageViewRow = Pick<
  Database["public"]["Tables"]["page_views"]["Row"],
  | "day"
  | "path"
  | "referrer_host"
  | "source"
  | "medium"
  | "campaign"
  | "country"
  | "device"
  | "visitor"
>;

const TZ = "Asia/Kolkata";

export function todayInKolkata(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(d); // YYYY-MM-DD
}

export function visitorHash(ip: string, ua: string, day: string) {
  const secret = process.env.ANALYTICS_SALT || process.env.SUPABASE_SECRET_KEY || "portfolio";
  return createHmac("sha256", secret).update(`${day}:${ip}:${ua}`).digest("hex").slice(0, 16);
}

const BOT_RE =
  /bot|crawl|spider|slurp|curl|wget|python-requests|httpclient|headless|lighthouse|pagespeed|preview|facebookexternalhit|embedly|vercel-screenshot|uptime|monitor/i;
export const isBot = (ua: string) => !ua || BOT_RE.test(ua);

export function deviceBucket(ua: string): "mobile" | "tablet" | "desktop" {
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) return "tablet";
  if (/mobi|iphone|android/i.test(ua)) return "mobile";
  return "desktop";
}

const SEARCH: Record<string, string> = {
  "google.": "google",
  "bing.com": "bing",
  "duckduckgo.com": "duckduckgo",
  "yahoo.": "yahoo",
  "yandex.": "yandex",
  "baidu.com": "baidu",
  "ecosia.org": "ecosia",
  "brave.com": "brave",
};
const SOCIAL: Record<string, string> = {
  "linkedin.com": "linkedin",
  "lnkd.in": "linkedin",
  "twitter.com": "x",
  "x.com": "x",
  "t.co": "x",
  "facebook.com": "facebook",
  "fb.com": "facebook",
  "instagram.com": "instagram",
  "youtube.com": "youtube",
  "youtu.be": "youtube",
  "reddit.com": "reddit",
  "threads.net": "threads",
  "whatsapp.com": "whatsapp",
  "telegram.": "telegram",
  "pinterest.": "pinterest",
};
const AI: Record<string, string> = {
  "chatgpt.com": "chatgpt",
  "openai.com": "chatgpt",
  "perplexity.ai": "perplexity",
  "claude.ai": "claude",
  "copilot.microsoft.com": "copilot",
  "gemini.google.com": "gemini",
  "you.com": "you.com",
};

/** Where a visit came from when there are no UTM parameters. */
export function classifyReferrer(host: string | null): { source: string; medium: string } {
  if (!host) return { source: "direct", medium: "none" };
  const h = host.toLowerCase().replace(/^www\./, "");
  for (const [k, v] of Object.entries(SEARCH))
    if (h.includes(k)) return { source: v, medium: "organic" };
  for (const [k, v] of Object.entries(SOCIAL))
    if (h.includes(k)) return { source: v, medium: "social" };
  for (const [k, v] of Object.entries(AI)) if (h.includes(k)) return { source: v, medium: "ai" };
  return { source: h, medium: "referral" };
}

export function hostOf(url: string | null | undefined) {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase() || null;
  } catch {
    return null;
  }
}

const clean = (v: unknown, max = 80) =>
  typeof v === "string" && v.trim() ? v.trim().toLowerCase().slice(0, max) : null;

export async function recordPageView(input: {
  path: string;
  referrer?: string | null;
  utm?: { source?: unknown; medium?: unknown; campaign?: unknown };
  ip: string;
  ua: string;
  country?: string | null;
}) {
  const day = todayInKolkata();
  const referrerHost = hostOf(input.referrer);
  const ownHost = hostOf(process.env.NEXT_PUBLIC_SITE_URL ?? "");
  const external = referrerHost && referrerHost !== ownHost ? referrerHost : null;
  const utmSource = clean(input.utm?.source);
  const utmMedium = clean(input.utm?.medium);
  const inferred = classifyReferrer(external);
  const row: PageViewInsert = {
    day,
    path: input.path.split("?")[0].slice(0, 200) || "/",
    referrer_host: external,
    source: utmSource ?? inferred.source,
    medium: utmMedium ?? (utmSource ? "campaign" : inferred.medium),
    campaign: clean(input.utm?.campaign, 120),
    country: input.country?.toUpperCase().slice(0, 2) ?? null,
    device: deviceBucket(input.ua),
    visitor: visitorHash(input.ip, input.ua, day),
  };
  const { error } = await createAdminClient().from("page_views").insert(row);
  return !error;
}

export async function purgeOldPageViews(keepDays: number) {
  const cutoff = new Date(Date.now() - keepDays * 86400_000);
  const { error, count } = await createAdminClient()
    .from("page_views")
    .delete({ count: "exact" })
    .lt("day", todayInKolkata(cutoff));
  return error
    ? { ok: false as const, error: error.code }
    : { ok: true as const, deleted: count ?? 0 };
}

export type Bucket = {
  key: string;
  label: string;
  views: number;
  visitors: number;
  extra?: string;
};
export type Analytics = {
  rangeDays: number;
  from: string;
  to: string;
  totals: { views: number; visitors: number; previousViews: number; previousVisitors: number };
  daily: { day: string; views: number; visitors: number }[];
  pages: Bucket[];
  sources: Bucket[];
  campaigns: Bucket[];
  referrers: Bucket[];
  countries: Bucket[];
  devices: Bucket[];
  truncated: boolean;
};

const MAX_ROWS = 100_000;

async function fetchRows(from: string, to: string) {
  const supabase = createAdminClient();
  const rows: PageViewRow[] = [];
  const page = 1000;
  for (let offset = 0; offset < MAX_ROWS; offset += page) {
    const { data, error } = await supabase
      .from("page_views")
      .select("day,path,referrer_host,source,medium,campaign,country,device,visitor")
      .gte("day", from)
      .lte("day", to)
      .order("id", { ascending: true })
      .range(offset, offset + page - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < page) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}

function bucketize(
  rows: PageViewRow[],
  key: (r: PageViewRow) => string | null,
  label?: (k: string, r: PageViewRow) => string,
  extra?: (r: PageViewRow) => string,
) {
  const map = new Map<
    string,
    { label: string; views: number; visitors: Set<string>; extra?: string }
  >();
  for (const r of rows) {
    const k = key(r);
    if (!k) continue;
    const b = map.get(k) ?? {
      label: label ? label(k, r) : k,
      views: 0,
      visitors: new Set<string>(),
      extra: extra?.(r),
    };
    b.views++;
    b.visitors.add(r.visitor);
    map.set(k, b);
  }
  return [...map.entries()]
    .map(([k, b]) => ({
      key: k,
      label: b.label,
      views: b.views,
      visitors: b.visitors.size,
      extra: b.extra,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 25);
}

const dayStr = (d: Date) => todayInKolkata(d);

/** Aggregates for the admin. Throws the Supabase error if the table is missing (code 42P01). */
export async function getAnalytics(rangeDays: number): Promise<Analytics> {
  const now = new Date();
  const to = dayStr(now);
  const from = dayStr(new Date(now.getTime() - (rangeDays - 1) * 86400_000));
  const prevTo = dayStr(new Date(now.getTime() - rangeDays * 86400_000));
  const prevFrom = dayStr(new Date(now.getTime() - (2 * rangeDays - 1) * 86400_000));
  const [{ rows, truncated }, prev] = await Promise.all([
    fetchRows(from, to),
    fetchRows(prevFrom, prevTo),
  ]);

  const visitors = new Set(rows.map((r) => r.visitor)).size;
  const prevVisitors = new Set(prev.rows.map((r) => r.visitor)).size;

  const byDay = new Map<string, { views: number; visitors: Set<string> }>();
  for (let i = 0; i < rangeDays; i++)
    byDay.set(dayStr(new Date(now.getTime() - (rangeDays - 1 - i) * 86400_000)), {
      views: 0,
      visitors: new Set(),
    });
  for (const r of rows) {
    const d = byDay.get(r.day);
    if (d) {
      d.views++;
      d.visitors.add(r.visitor);
    }
  }

  return {
    rangeDays,
    from,
    to,
    totals: {
      views: rows.length,
      visitors,
      previousViews: prev.rows.length,
      previousVisitors: prevVisitors,
    },
    daily: [...byDay.entries()].map(([day, v]) => ({
      day,
      views: v.views,
      visitors: v.visitors.size,
    })),
    pages: bucketize(rows, (r) => r.path),
    sources: bucketize(
      rows,
      (r) => `${r.source} / ${r.medium}`,
      (k) => k.split(" / ")[0],
      (r) => r.medium,
    ),
    campaigns: bucketize(
      rows.filter((r) => r.campaign),
      (r) => `${r.campaign} · ${r.source} / ${r.medium}`,
      (_k, r) => r.campaign ?? "",
      (r) => `${r.source} / ${r.medium}`,
    ),
    referrers: bucketize(rows, (r) => r.referrer_host),
    countries: bucketize(rows, (r) => r.country),
    devices: bucketize(rows, (r) => r.device),
    truncated: truncated || prev.truncated,
  };
}
