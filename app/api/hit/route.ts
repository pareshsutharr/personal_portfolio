import { isBot, recordPageView } from "@/lib/analytics";

export const dynamic = "force-dynamic";

/**
 * Page-view beacon. Accepts a small JSON body from the public pages, never sets
 * a cookie, never stores an IP, and always answers 204 so a problem here can
 * never surface to a visitor.
 */
export async function POST(request: Request) {
  try {
    const ua = request.headers.get("user-agent") ?? "";
    if (isBot(ua)) return new Response(null, { status: 204 });
    const body = (await request.json().catch(() => null)) as {
      path?: unknown;
      referrer?: unknown;
      utm?: { source?: unknown; medium?: unknown; campaign?: unknown };
    } | null;
    const path = typeof body?.path === "string" ? body.path : "";
    if (
      !path.startsWith("/") ||
      path.startsWith("/admin") ||
      path.startsWith("/api") ||
      path.length > 300
    ) {
      return new Response(null, { status: 204 });
    }
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      "0";
    await recordPageView({
      path,
      referrer: typeof body?.referrer === "string" ? body.referrer : null,
      utm: body?.utm ?? {},
      ip,
      ua,
      country: request.headers.get("x-vercel-ip-country"),
    });
  } catch {
    // Analytics must never break a page.
  }
  return new Response(null, { status: 204 });
}
