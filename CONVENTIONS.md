# Engineering conventions — Paresh Suthar portfolio

Read this fully before writing code. It is the contract between every part of the app.

## Stack (already installed — add nothing else)

- Next.js 16.4 (App Router, Turbopack, **`proxy.ts` not `middleware.ts`**, typed routes ON), React 19.3, TypeScript strict
- Tailwind CSS v4 (CSS-first config in `app/globals.css`; no `tailwind.config`)
- `motion` v14 (`import { motion, useReducedMotion } from "motion/react"`)
- `lucide-react`, `zod` v4 (`z.email()`, `z.url()`, `z.uuid()` are top-level), `sonner` toasts
- `@dnd-kit/core` + `@dnd-kit/sortable` + `@dnd-kit/utilities` for drag-and-drop ordering
- `react-hook-form` + `@hookform/resolvers/zod` allowed for complex admin forms (project editor). Simpler forms may use controlled state.
- `cmdk` for the admin command palette
- Supabase: `@supabase/ssr` 0.12 + `@supabase/supabase-js` 2.117

**Next.js 16 notes** (this is NOT the Next.js you remember):

- Docs live in `node_modules/next/dist/docs/`. Check them before using an API you are unsure about.
- `params` and `searchParams` are **Promises** in pages/layouts: `const { slug } = await params`.
- Page/layout prop types: `PageProps<"/projects/[slug]">`, `LayoutProps<"/">` are globally available.
- `cacheComponents` is OFF. Public routes use ISR via `export const revalidate = 60` in `app/(public)/layout.tsx`; admin actions call `revalidatePublic()` from `lib/actions/helpers.ts` which runs `revalidatePath("/", "layout")`.
- Admin routes are dynamic (they read cookies). Add `export const dynamic = "force-dynamic"` in `app/admin/(protected)/layout.tsx`.
- `typedRoutes: true` — `<Link href>` must be a known route string or template literal typed as `Route`. For dynamic hrefs from data, cast: `href={\`/projects/${slug}\` as Route}`with`import type { Route } from "next"`. The `ButtonLink`component in`components/ui/button.tsx`accepts`href: string`.
- `next/image`: Supabase storage host is whitelisted in `next.config.ts`. Use `<Image fill sizes="…">` inside a relatively positioned, sized parent. For arbitrary/unknown external URLs use `unoptimized`.

## Directory map

```
app/
  layout.tsx                 root: fonts, Toaster (done — do not touch)
  globals.css                design tokens (done — extend only by adding, never rename tokens)
  (public)/                  public site (layout.tsx owns Nav + Footer + cursor + revalidate=60)
  admin/
    login/page.tsx           login (outside the protected group)
    (protected)/layout.tsx   sidebar shell, requires admin claims, force-dynamic
    (protected)/page.tsx     dashboard
    (protected)/<entity>/    one folder per CMS entity
  api/                       route handlers only when server actions do not fit
  sitemap.ts, robots.ts, opengraph-image.tsx, not-found.tsx
components/
  ui/            primitives (done): Button, ButtonLink, Input, Textarea, Select, Switch, Checkbox,
                 Field, Label, Hint, FieldError, FormSection, Badge, StatusDot, Skeleton, TableSkeleton,
                 Dialog, Drawer, ConfirmDialog, EmptyState, Table/THead/TBody/TR/TH/TD, Panel/PanelHeader/PanelBody, Kbd, Tabs
  motion/        Reveal, Stagger, StaggerItem, SplitWords, Counter, Magnetic (done)
  portfolio/     Section, Eyebrow, SectionHeader, MetaRow, PageHeader (done) + public components
  projects/      project showcase / cards / case-study blocks (public)
  timeline/      experience + education + skill timeline (public)
  contact/       contact form (public)
  admin/         admin-only components (sidebar, command palette, sortable list, image picker, …)
lib/
  supabase/      client.ts (browser), server.ts (cookies), public.ts (anon, no cookies), admin.ts (secret key, server-only), proxy.ts
  queries/public.ts   ALL public reads (done). Admin pages read with `createClient()` from lib/supabase/server directly or via lib/queries/admin.ts
  actions/       "use server" modules per entity. helpers.ts has requireAdmin/parseInput/revalidatePublic/ok/fail/dbError
  validation/    zod schemas (done): schemas.ts, common.ts
  utils/         cn, format, slug, storage
hooks/           use-action.ts (run server actions with toasts), use-media-query.ts
types/           database.ts (generated), index.ts (aliases, labels, ActionResult)
```

## Data access rules

- **Public pages** import only from `lib/queries/public.ts`. Never call `cookies()` in public routes (breaks ISR).
- **Admin pages** (server components) read via `await createClient()` from `@/lib/supabase/server`. RLS applies as the admin.
- **Mutations** are server actions in `lib/actions/<entity>.ts`, always:
  1. `const { supabase } = await requireAdmin();`
  2. `const parsed = parseInput(schema, input); if (!parsed.ok) return parsed.result;`
  3. query, then `if (error) return fail(dbError(error, "…"));`
  4. `revalidatePublic(["/route"])` and `return ok(data, "Saved.")`.
     See `lib/actions/services.ts` as the reference. Return type is always `ActionResult<T>`.
- Client components call actions through `useAction(action)` from `hooks/use-action.ts` → it handles pending state, toasts, `fieldErrors`, and a retry toast on thrown errors.
- Never import `lib/supabase/admin.ts` from anything but server actions that truly need to bypass RLS (today: contact submissions only).
- Lists use `display_order`; reorder actions receive `ids: string[]` in the new order.

## Content rules (very important)

- **Never invent facts.** No fake metrics, clients, dates, results, team sizes. If a field is null, hide the block on the public site. In admin, show an empty-state hint ("Add from admin") instead.
- Copy tone: confident, technical, short. Verbs: Built, Designed, Integrated, Deployed, Maintained, Architected, Implemented. Never "passionate", "cutting-edge", "leveraging", "transforming ideas into reality".
- Confidential projects: if `confidential` is true and `confidential_mode` is `summary`, public pages show title/category/short_description/technologies and the label "Confidential client project", and hide client/company/links/images/case study. `hidden` → never shown (queries already filter). `full` → show everything but replace client/company with "Confidential client".

## Visual language (public)

- Backgrounds `bg-bg-950` / `bg-bg-900`; panels `bg-surface-900` with `border-line-800`. No glassmorphism, no glow borders, no purple, no blobs, no big gradient text.
- Accent `ember-*` (burnt orange) used sparingly: active nav, index numbers, CTAs, timeline nodes, hover states. `crimson-*` for the rare deep-red detail. `amber-*` for warnings/status only.
- Headlines: `font-display` (Space Grotesk) with `text-display-xl|lg|md|sm` utilities. Body: Inter. Technical labels: `label-mono` utility (IBM Plex Mono, uppercase, tracked).
- Radii small: `rounded-xs|sm|md` only. Hairlines via `border-line-800`. Utilities available: `container-x`, `label-mono`, `grain`, `grid-lines`, `hairline`, `no-scrollbar`.
- Section rhythm: wrap sections in `<Section>` and lead with `<SectionHeader index={n} eyebrow="…" title="…" />`.
- "System interface" details: `MetaRow` for BUILD STATUS / TECH STACK / ROLE / YEAR; `StatusDot` + mono label for availability.
- Motion: `Reveal` for scroll reveals, `Stagger`/`StaggerItem` for lists, `Counter` for numbers, `Magnetic` for primary CTAs. Always respect `useReducedMotion()`. No bouncing, no particles, nothing that animates forever except the status dot ping (already disabled under reduced motion).
- Mobile first: every public section must look right at 375px. Touch targets ≥ 44px.

## Visual language (admin)

- Feels like Linear/Vercel: dark, dense but calm, 13–14px text, sidebar 240px, content max-width ~1200px, `Panel` cards, tables with mono headers, `Drawer` for create/edit, `ConfirmDialog` before deletes, `Skeleton` loading states, `EmptyState` for empty lists, `toast` for every outcome.
- Every admin list page = header (title, count, primary "Add" button) + optional filters + table/sortable list. Every row: edit (opens drawer), visibility toggle (Switch), delete (confirm).

## Accessibility

Semantic HTML, keyboard reachable, visible focus (global style exists), alt text on all images (fall back to the entity title), `aria-*` only when needed, reduced-motion honored, color contrast ≥ 4.5:1 for text (fg-300 on bg-950 passes; fg-500 is for labels ≥ 11px mono only).

## Quality gates before you report done

```
pnpm exec tsc --noEmit
pnpm lint
```

Both must pass with zero errors for the files you own. Do not leave `any`, unused imports, or `console.log`.
