# Paresh Suthar — Portfolio + Admin CMS

Premium personal portfolio with a private CMS, built with Next.js 16, TypeScript, Tailwind CSS v4, Motion and Supabase (Postgres, Auth, Storage, RLS). Deploys to Vercel.

- Public site: `/`, `/projects`, `/projects/[slug]`, `/about`, `/experience`, `/skills`, `/certifications`, `/services`, `/contact`, `/resume`, `/now`
- Admin CMS: `/admin` (Supabase Auth, email + password)

Engineering conventions live in [CONVENTIONS.md](./CONVENTIONS.md).

## Local setup

```bash
pnpm install
cp .env.example .env.local   # fill in the values below
pnpm dev
```

`.env.local`

| Variable                                                       | Where it runs         | Purpose                                                          |
| -------------------------------------------------------------- | --------------------- | ---------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`                                     | browser + server      | Supabase project URL                                             |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`                         | browser + server      | Publishable key (safe to expose)                                 |
| `SUPABASE_SECRET_KEY`                                          | server only           | Secret key; used only for contact-form inserts and admin scripts |
| `NEXT_PUBLIC_SITE_URL`                                         | browser + server      | Canonical URL for metadata, sitemap, OG images                   |
| `RESEND_API_KEY`, `CONTACT_NOTIFY_EMAIL`, `CONTACT_FROM_EMAIL` | server only, optional | Email notification for new contact messages                      |

Never prefix a secret with `NEXT_PUBLIC_`.

## Database

Schema, RLS policies, grants and storage live in `supabase/migrations`. Seed content (verified facts only, placeholders clearly marked) is in `supabase/seed.sql`.

Apply to a hosted project through the Management API (no DB password needed):

```bash
SUPABASE_ACCESS_TOKEN=sbp_xxx SUPABASE_PROJECT_REF=xxx pnpm db:apply        # migrations
SUPABASE_ACCESS_TOKEN=sbp_xxx SUPABASE_PROJECT_REF=xxx pnpm db:seed         # migrations + seed
SUPABASE_ACCESS_TOKEN=sbp_xxx SUPABASE_PROJECT_REF=xxx pnpm db:types        # regenerate types/database.ts
```

New schema change: `supabase migration new <name>`, edit the file, run `pnpm db:apply`, then `pnpm db:types`.

Security model:

- Public (anon) role can only `select`, and only published / visible rows.
- Admin writes require a Supabase Auth user whose `app_metadata.role` is `admin` (checked by `public.is_admin()` in every policy).
- Contact messages are inserted server-side with the secret key; anon has no insert grant.
- Storage bucket `media` is public-read, admin-write.

## Admin user

```bash
pnpm admin:create you@example.com 'a-strong-password'
```

Creates (or updates) the user, confirms the email and sets `app_metadata.role = admin`. Public sign-up is disabled in the Supabase auth config.

## Scripts

| Command                     | What it does                               |
| --------------------------- | ------------------------------------------ |
| `pnpm dev`                  | Dev server (Turbopack)                     |
| `pnpm build` / `pnpm start` | Production build / serve                   |
| `pnpm typecheck`            | `tsc --noEmit`                             |
| `pnpm lint`                 | ESLint (Next core-web-vitals + TypeScript) |
| `pnpm format`               | Prettier with the Tailwind class sorter    |

## Deploy (Vercel)

1. Import the repo in Vercel, framework Next.js.
2. Add the environment variables above (set `NEXT_PUBLIC_SITE_URL` to the production domain).
3. In Supabase → Authentication → URL configuration, set Site URL to the production domain and add `https://<domain>/**` to the redirect allow-list.
4. Deploy. `sitemap.xml`, `robots.txt` and `opengraph-image` are generated automatically.

## Project structure

```
app/(public)      public site (ISR, revalidated after every admin change)
app/admin         CMS (dynamic, cookie-based auth, guarded by proxy.ts)
components/ui     primitives · components/admin · components/portfolio · components/projects · components/timeline · components/contact
lib/supabase      browser / server / public / admin clients + proxy session refresh
lib/queries       public read layer · lib/actions server actions · lib/validation zod schemas
supabase/         migrations + seed · scripts/ db + auth helpers · types/ generated DB types
```
# personal_portfolio
# personal_portfolio
