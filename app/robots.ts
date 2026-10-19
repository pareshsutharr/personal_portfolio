import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

const PRIVATE = ["/admin", "/preview", "/api"];

/**
 * Search engines and AI crawlers are all welcome on the public pages. The AI
 * agents are named explicitly so the policy is deliberate and easy to change
 * (for example to opt out of training while staying in AI search).
 */
const AI_AGENTS = [
  "GPTBot",
  "OAI-SearchBot",
  "ChatGPT-User",
  "ClaudeBot",
  "Claude-SearchBot",
  "Claude-User",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckAssistBot",
  "meta-externalagent",
  "Amazonbot",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: PRIVATE },
      ...AI_AGENTS.map((userAgent) => ({ userAgent, allow: "/", disallow: PRIVATE })),
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
  };
}
