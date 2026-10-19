import "server-only";

import { absoluteUrl, siteUrl } from "@/lib/seo";

/**
 * IndexNow: tells Bing, Yandex, Naver and Seznam about new or changed URLs
 * within minutes (Bing's index also feeds ChatGPT search and Copilot). The key
 * is public by design; the engines verify it by fetching the key file.
 */
export const INDEXNOW_KEY = "423bc9f58e1a9f28833c01ac589f80d4";

export async function submitIndexNow(
  paths: string[],
): Promise<{ ok: boolean; status: number; count: number }> {
  const host = new URL(siteUrl()).hostname;
  if (/localhost|127\.0\.0\.1/.test(host) || paths.length === 0)
    return { ok: false, status: 0, count: 0 };
  const urlList = [...new Set(paths.map(absoluteUrl))].slice(0, 10000);
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: absoluteUrl(`/${INDEXNOW_KEY}.txt`),
        urlList,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    return { ok: res.ok, status: res.status, count: urlList.length };
  } catch {
    return { ok: false, status: 0, count: urlList.length };
  }
}
