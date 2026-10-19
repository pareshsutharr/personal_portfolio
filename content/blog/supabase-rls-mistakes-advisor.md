---
title: "Supabase RLS mistakes I made, and how the advisor caught them"
description: "Four row level security mistakes from real projects: a table with RLS off, a policy that leaked drafts, a function with a mutable search path, and a storage bucket anyone could write to. What each looked like, how Supabase's advisor flagged it, and the fix."
date: 2027-07-05T03:30:00Z
tags: [supabase, postgres, rls, security]
keywords: [supabase rls best practices, supabase security advisor, rls policy mistakes, supabase function search_path, supabase storage policy]
image: /blog/stock/fingerprint-1.webp
imageAlt: "Fingerprint scan illustration in blue"
imageCredit: "mikemacmarketing"
imageCreditUrl: "https://commons.wikimedia.org/wiki/File:Fingerprint_Scanner.jpg"
imageLicense: "CC BY 2.0"
---

Row level security is the reason a Supabase publishable key can be in the browser. It is also a place where a small mistake is a full data leak, with no error and no log line. The Supabase dashboard has an advisor that scans for the common ones. These are the four it caught on my projects, in the order I would check them on yours.

## 1. A table with RLS off

The advisor's first and loudest finding. A table created from the SQL editor without `enable row level security` is readable and writable by anyone holding the publishable key. On a food-ordering site, that table was `orders`.

```sql
alter table public.orders enable row level security;
```

Enabling RLS with no policies blocks everything, which is the safe starting point. Then add the narrowest policy that makes the app work. Run this to list any tables still open:

```sql
select tablename from pg_tables where schemaname = 'public' and rowsecurity = false;
```

## 2. A policy broader than the page

The public projects page needs published projects. My first policy was:

```sql
create policy projects_read on public.projects for select using (true);
```

Which also let anyone call the API and read drafts, including a confidential client's project I had not published. The page filtered by status; the policy did not. The policy is the only line that counts:

```sql
create policy projects_public_read on public.projects
  for select to anon, authenticated
  using (status = 'published' and visibility = 'public' and deleted_at is null);
```

The rule I took from this: write the policy as if the frontend did not exist, because to an attacker it does not.

## 3. A function with a mutable search path

Helper functions used in policies, like `is_admin()`, are `security definer` so they can read what the caller cannot. The advisor flagged mine for a mutable `search_path`: a caller who could create objects in a schema earlier in the path could shadow a function name and run their own code with the definer's rights. The fix is one line:

```sql
create or replace function public.is_admin() returns boolean
language sql stable security definer
set search_path = ''
as $$ select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false); $$;
```

With an empty search path, every reference inside the function must be schema-qualified, which `auth.jwt()` already is.

## 4. A storage bucket with a permissive write policy

The media bucket is public to read, which is intended; images on the site need URLs. The upload policy I wrote first allowed any authenticated user to insert. The site has one admin, but "authenticated" includes anyone who signs up if signup is ever enabled, and it was for a day. Scope the write to the admin and the bucket:

```sql
create policy media_admin_write on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
```

Then turn off public signup in Auth settings unless the app needs it. Both were in the advisor's list.

## The habits that replaced the advisor

- **Enable RLS in the same migration that creates the table.** Never later.
- **Test as anon.** With `curl` and the publishable key, try to read a draft, write a row, and list a bucket. Every one should fail. I keep those three commands in the repository's README.
- **Prefer the service role on the server for public writes.** The contact form inserts with the secret key from a server action after validation and rate limiting, so no insert policy for `anon` exists at all.
- **Run the advisor after every schema change.** It takes a second and it has been right every time.

## Sources

- Row level security in Supabase: [supabase.com/docs/guides/database/postgres/row-level-security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- Security advisor and the `function_search_path_mutable` lint: [supabase.com/docs/guides/database/database-advisors](https://supabase.com/docs/guides/database/database-advisors)
- Postgres `security definer` and `search_path`: [postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY](https://www.postgresql.org/docs/current/sql-createfunction.html#SQL-CREATEFUNCTION-SECURITY)
- Storage access control: [supabase.com/docs/guides/storage/security/access-control](https://supabase.com/docs/guides/storage/security/access-control)
