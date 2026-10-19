import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Only admin routes, draft previews and auth callbacks need session handling.
  matcher: ["/admin/:path*", "/preview/:path*", "/auth/:path*"],
};
