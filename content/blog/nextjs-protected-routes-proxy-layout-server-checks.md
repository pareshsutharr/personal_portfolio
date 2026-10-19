---
title: "Protecting routes in the Next.js App Router: the edge check, the layout check, and the one that actually matters"
description: "Three places can say 'you are not allowed here' in a Next.js app, and they are not interchangeable. How the admin side of this portfolio is protected: a fast redirect at the edge, a session read in the protected layout, and authorisation inside every server action and route handler."
date: 2027-11-22T03:30:00Z
tags: [nextjs, auth, security, supabase]
keywords: [next.js protect routes app router, next.js middleware auth redirect, server action authorization, next.js layout auth check, supabase auth next.js admin]
project: portfolio
---

The admin pages of this site live under `/admin`. Three layers decide who gets in, and when I review other people's Next.js projects, the usual mistake is having only the first one.

## Layer 1: the request-level redirect

A file at the project root runs before the route renders. In the Next.js version this site uses it is `proxy.ts`; older projects know it as `middleware.ts`. Its job is cheap and narrow: if there is no session cookie at all, send the person to the login page without rendering anything.

```ts
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = pathname.startsWith("/admin") && !pathname.startsWith("/admin/login");
  const hasSession = request.cookies.getAll().some((c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token"));
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = "/admin/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/admin/:path*"] };
```

This only checks that a cookie *exists*. It does not verify it, and it must not be the only check: a forged cookie passes it. It exists so that logged-out visitors never see a flash of admin UI and the server does not render pages for them.

## Layer 2: the protected layout

Every page under `app/admin/(protected)/` shares a layout that reads and verifies the session on the server:

```tsx
// app/admin/(protected)/layout.tsx
import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();        // verifies the token with Supabase, returns null if invalid
  if (!user) redirect("/admin/login");
  if (!user.isAdmin) redirect("/");
  return <AdminShell user={user}>{children}</AdminShell>;
}
```

`getSessionUser` calls Supabase's `auth.getUser()`, which validates the token against the auth server rather than trusting the cookie's claims. The route group in parentheses means the login page sits outside this layout and stays reachable.

A layout check is a page-rendering check. It is the right place to gate the UI, and the wrong place to gate data, for the reason in the next layer.

## Layer 3: every mutation and data read

Server actions and route handlers are HTTP endpoints. Anyone can call them with `curl`, with any body, without ever rendering the layout. So each one checks authorisation itself:

```ts
"use server";
export async function updateProject(_prev: ActionResult | null, formData: FormData) {
  const user = await requireAdmin();          // throws or redirects if not an admin
  const parsed = projectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, fieldErrors: flatten(parsed.error) };
  await db.from("projects").update(parsed.data).eq("id", parsed.data.id);
  revalidatePath("/work");
  return { ok: true };
}
```

`requireAdmin` is three lines and is the first line of every action and handler in the admin. There is no exception, because the one exception is the one that gets found.

Data reads in server components get the same treatment when the data is private: the admin messages page calls `requireAdmin()` before querying, even though the layout already checked. The layout can be bypassed by a direct request to a route handler; a component's own check cannot.

## And the database checks too

Supabase row-level security is the fourth layer and the only one that does not live in this codebase. Public tables allow anonymous reads of published rows only; writes require the service role, which only the server has. If every line of Next.js above were deleted, the database would still refuse to hand out contact messages to a browser.

## What goes wrong without the layers

- **Only the edge check**: forge a cookie name, see everything. I have found this in two client projects.
- **Only the layout check**: `curl -X POST /actions/deleteProject` works for anyone who can find the action id in the page's JavaScript.
- **Only RLS**: the UI renders for logged-out visitors and shows empty tables with admin chrome around them, which looks broken and leaks structure.

Each layer is a few lines. Together they are the difference between "protected" and "looks protected".

## Sources

- Next.js authentication guide: [nextjs.org/docs/app/guides/authentication](https://nextjs.org/docs/app/guides/authentication)
- Next.js proxy (formerly middleware): [nextjs.org/docs/app/api-reference/file-conventions/proxy](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- Server actions security: [nextjs.org/docs/app/guides/data-security](https://nextjs.org/docs/app/guides/data-security)
- Supabase server-side auth for Next.js: [supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- Supabase row-level security: [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security)
