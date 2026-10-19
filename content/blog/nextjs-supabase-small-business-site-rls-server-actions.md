---
title: "Next.js and Supabase for a small business site: RLS, server actions and image uploads"
description: "The setup I used for this portfolio's admin and for a food-ordering site: Postgres with row level security so the public key is safe in the browser, server actions for writes, and a storage bucket for images with Next.js image optimisation on top."
date: 2026-11-30T03:30:00Z
tags: [nextjs, supabase, postgres, rls, react]
keywords: [next.js supabase tutorial, supabase row level security next.js, supabase server actions, supabase storage next/image, supabase ssr cookies next.js app router]
project: biryani-bazar
---

For anything that needs a database, an admin login and image uploads, but does not need a separate backend, I reach for Next.js with Supabase. This portfolio's admin runs on it. So does a food e-commerce site I built. The combination is cheap, fast to build, and secure if you respect one rule: the database decides who can read what, not your JavaScript.

## The one rule: row level security

Supabase gives the browser a publishable key. Anyone can read it from your bundle. That is fine only because Postgres row level security (RLS) checks every query against policies you write. With RLS on and no policies, nobody can read anything. You then open exactly what should be public.

```sql
alter table public.projects enable row level security;

-- Anyone may read published, public projects.
create policy projects_public_read on public.projects
  for select to anon, authenticated
  using (status = 'published' and visibility = 'public' and deleted_at is null);

-- Only the admin may write.
create policy projects_admin_write on public.projects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
```

`is_admin()` is a small SQL function that reads a role from the user's JWT:

```sql
create function public.is_admin() returns boolean
language sql stable as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;
```

Set `app_metadata.role = "admin"` on your one admin user with the service role key, from a script, never from the browser. Now a draft project is invisible to the public even if someone calls the API directly with your publishable key. That is the whole point.

## Two clients, two keys

- **Publishable key**, in the browser and in server components for public reads. Subject to RLS.
- **Secret (service role) key**, server only, for the few things the public needs to write without being logged in, like a contact form insert. Bypasses RLS, so it never leaves the server.

With the App Router, use `@supabase/ssr` so the auth session lives in cookies and works in server components, server actions and route handlers:

```ts
// lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const store = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => list.forEach(({ name, value, options }) => store.set(name, value, options)),
    },
  });
}
```

## Writes go through server actions

A server action runs on the server, so it can check the session properly and the client never sees the query. Every admin write in my projects follows this shape:

```ts
"use server";

export async function updateProject(id: string, input: unknown) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (data?.claims?.app_metadata?.role !== "admin") throw new Error("Unauthorized");

  const parsed = projectSchema.safeParse(input);          // zod
  if (!parsed.success) return { ok: false, error: "Check the fields" };

  const { error } = await supabase.from("projects").update(parsed.data).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/projects`);
  return { ok: true };
}
```

The role check here is belt and braces. Even without it, RLS would reject the update for a non-admin. Keep both; a mistake in one is caught by the other.

## Public pages read with the publishable key

Public pages just query. RLS does the filtering, so the code stays simple and there is no way to accidentally leak a draft:

```ts
const { data: projects } = await supabase
  .from("projects")
  .select("id, title, slug, short_description, cover_image")
  .order("display_order");
```

Mark those pages with `export const revalidate = 60` and they are served from cache with a refresh every minute. Content edits in admin show within a minute with no deploy.

## Images: one public bucket plus next/image

Create one bucket, make it public, restrict uploads to the admin with a storage policy, and cap file size and types at the bucket level:

```sql
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','image/svg+xml','application/pdf']);

create policy media_admin_write on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.is_admin());
```

Upload from a server action with the user's session, store the public URL in your table, and let `next/image` resize and convert it. One line in `next.config.ts` allows the host:

```ts
images: { remotePatterns: [{ protocol: "https", hostname: "<project>.supabase.co", pathname: "/storage/v1/object/public/**" }] },
```

Visitors then get WebP or AVIF at the right size, and the original stays in the bucket.

## What I would tell past me

- **Turn RLS on before you insert the first row.** Retrofitting policies on a live table is stressful.
- **Run the Supabase advisor.** The dashboard lists tables without RLS, functions with a mutable search path, and missing indexes. I fixed four things it found on this site.
- **Never put the secret key in a `NEXT_PUBLIC_` variable.** The prefix means "ship to the browser".
- **Keep migrations in the repo.** Supabase's CLI generates typed clients from your schema; the types caught three bugs before they shipped.

## Sources

- Row level security in Supabase: [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Server-side auth for Next.js with `@supabase/ssr`: [supabase.com/docs/guides/auth/server-side/nextjs](https://supabase.com/docs/guides/auth/server-side/nextjs)
- Storage access control: [supabase.com/docs/guides/storage/security/access-control](https://supabase.com/docs/guides/storage/security/access-control)
- Next.js server actions: [nextjs.org/docs/app/getting-started/updating-data](https://nextjs.org/docs/app/getting-started/updating-data)
- `next/image` remote patterns: [nextjs.org/docs/app/api-reference/components/image#remotepatterns](https://nextjs.org/docs/app/api-reference/components/image#remotepatterns)
