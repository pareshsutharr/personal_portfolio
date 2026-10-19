import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/database";

const ADMIN_PREFIX = "/admin";
const LOGIN_PATH = "/admin/login";

/**
 * Refreshes the Supabase session cookie on every matched request and guards
 * /admin routes. Returns the response that carries any refreshed cookies.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          if (headers) {
            for (const [key, value] of Object.entries(headers)) {
              supabaseResponse.headers.set(key, value);
            }
          }
        },
      },
    },
  );

  // IMPORTANT: no code between createServerClient and getClaims().
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  const isAdmin = claims?.app_metadata?.role === "admin";

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith("/preview");
  const isLoginRoute = pathname === LOGIN_PATH;

  if (isAdminRoute && !isLoginRoute && !isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = LOGIN_PATH;
    url.searchParams.set("next", pathname);
    return withCookies(NextResponse.redirect(url), supabaseResponse);
  }

  if (isLoginRoute && isAdmin) {
    const url = request.nextUrl.clone();
    url.pathname = ADMIN_PREFIX;
    url.search = "";
    return withCookies(NextResponse.redirect(url), supabaseResponse);
  }

  return supabaseResponse;
}

function withCookies(target: NextResponse, source: NextResponse) {
  for (const cookie of source.cookies.getAll()) {
    target.cookies.set(cookie);
  }
  for (const header of ["cache-control", "expires", "pragma"]) {
    const value = source.headers.get(header);
    if (value) target.headers.set(header, value);
  }
  return target;
}
