import Image from "next/image";
import { DeviceFrame, asCoverFrame } from "@/components/projects/device-frame";
import Link from "next/link";
import type * as React from "react";
import { Globe, Lock } from "lucide-react";
import { AppStoreIcon, GitHubIcon, GooglePlayIcon } from "@/components/portfolio/brand-icons";
import { DynamicIcon } from "@/components/portfolio/icon";
import { Eyebrow, MetaRow } from "@/components/portfolio/section";
import { JsonLd } from "@/components/seo/json-ld";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { breadcrumbJsonLd, creativeWorkJsonLd } from "@/lib/seo";
import { cn } from "@/lib/utils/cn";
import { padIndex, yearOf } from "@/lib/utils/format";
import { isOptimizableImage } from "@/lib/utils/image";
import { SKILL_CATEGORY_LABELS, type ProjectWithRelations, type SkillCategory } from "@/types";
import { ScreenshotGallery, type GalleryImage } from "./gallery";
import { isSummaryConfidential } from "./project-card";
import { Prose } from "./prose";
import { SectionNav, type NavSection } from "./section-nav";

/* ----------------------------------------------------------------------------
   Helpers
   -------------------------------------------------------------------------- */

export function projectYearRange(p: ProjectWithRelations) {
  if (p.year_label) return p.year_label;
  const start = yearOf(p.start_date);
  const end = yearOf(p.end_date);
  if (start && end && start !== end) return `${start} — ${end}`;
  return start ?? end;
}

type ActionLink = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

function actionLinks(p: ProjectWithRelations): ActionLink[] {
  const links: ActionLink[] = [];
  if (p.live_url) links.push({ label: "Live site", href: p.live_url, icon: Globe });
  if (p.github_url) links.push({ label: "GitHub", href: p.github_url, icon: GitHubIcon });
  if (p.app_store_url)
    links.push({ label: "App Store", href: p.app_store_url, icon: AppStoreIcon });
  if (p.play_store_url)
    links.push({ label: "Play Store", href: p.play_store_url, icon: GooglePlayIcon });
  return links;
}

function ActionLinks({ links, size = "md" }: { links: ActionLink[]; size?: "sm" | "md" }) {
  if (!links.length) return null;
  return (
    <ul className="flex flex-wrap gap-2">
      {links.map((l, i) => (
        <li key={l.href}>
          <ButtonLink href={l.href} external variant={i === 0 ? "primary" : "outline"} size={size}>
            <l.icon className="h-4 w-4" />
            {l.label}
          </ButtonLink>
        </li>
      ))}
    </ul>
  );
}

function groupTechnologies(p: ProjectWithRelations) {
  return (Object.keys(SKILL_CATEGORY_LABELS) as SkillCategory[])
    .map((cat) => ({
      category: cat,
      label: SKILL_CATEGORY_LABELS[cat],
      items: p.technologies.filter((t) => t.category === cat),
    }))
    .filter((g) => g.items.length > 0);
}

function toGalleryImage(img: ProjectWithRelations["images"][number], title: string): GalleryImage {
  return {
    id: img.id,
    url: img.image_url,
    alt: img.alt_text ?? img.caption ?? title,
    caption: img.caption,
    type: img.type,
  };
}

/* ----------------------------------------------------------------------------
   Blocks
   -------------------------------------------------------------------------- */

function TechnologyBlock({ project }: { project: ProjectWithRelations }) {
  const groups = groupTechnologies(project);
  if (!groups.length) return null;
  return (
    <div className="divide-y divide-line-800 border-y border-line-800">
      {groups.map((g) => (
        <div key={g.category} className="grid gap-3 py-4 sm:grid-cols-[140px_1fr] sm:gap-6">
          <p className="pt-1.5 label-mono">{g.label}</p>
          <ul className="flex flex-wrap gap-1.5">
            {g.items.map((t) => (
              <li key={t.id}>
                <Badge tone="outline" className="px-2 py-1 text-xs">
                  {t.name}
                </Badge>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function FeaturesBlock({ features }: { features: ProjectWithRelations["features"] }) {
  return (
    <ul className="grid gap-px overflow-hidden rounded-sm bg-line-800 sm:grid-cols-2">
      {features.map((f, i) => (
        <li key={f.id} className="flex flex-col gap-3 bg-bg-950 p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] text-ember-400 tabular-nums">
              {padIndex(i + 1)}
            </span>
            {f.icon ? <DynamicIcon name={f.icon} className="h-4 w-4 text-fg-300" /> : null}
          </div>
          <h3 className="text-base font-medium text-fg-50">{f.title}</h3>
          {f.description ? (
            <p className="text-sm leading-relaxed text-fg-300">{f.description}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

function ArchitectureImages({
  images,
  title,
}: {
  images: ProjectWithRelations["images"];
  title: string;
}) {
  if (!images.length) return null;
  return (
    <div className="space-y-6">
      {images.map((img) => (
        <figure key={img.id}>
          <div className="relative aspect-[16/9] overflow-hidden rounded-sm border border-line-700 bg-surface-900">
            <Image
              src={img.image_url}
              alt={img.alt_text ?? img.caption ?? `${title} architecture`}
              fill
              sizes="(min-width: 1024px) 60vw, 100vw"
              unoptimized={!isOptimizableImage(img.image_url)}
              className="object-contain"
            />
          </div>
          {img.caption ? (
            <figcaption className="mt-3 font-mono text-[11px] text-fg-500">
              {img.caption}
            </figcaption>
          ) : null}
        </figure>
      ))}
    </div>
  );
}

function ResultsBlock({ project }: { project: ProjectWithRelations }) {
  const parts = [
    { label: "Results", text: project.results },
    { label: "Outcome", text: project.outcome },
    { label: "Impact", text: project.impact },
  ].filter((x): x is { label: string; text: string } => Boolean(x.text));
  if (!parts.length) return null;
  return (
    <div className={cn("grid gap-8", parts.length > 1 && "lg:grid-cols-2")}>
      {parts.map((p) => (
        <div key={p.label} className="border-l-2 border-ember-500/60 pl-5">
          <p className="label-mono text-ember-400">{p.label}</p>
          <Prose text={p.text} className="mt-3" />
        </div>
      ))}
    </div>
  );
}

function ResponsibilitiesBlock({ items }: { items: string[] }) {
  return (
    <ol className="divide-y divide-line-800 border-y border-line-800">
      {items.map((item, i) => (
        <li key={i} className="flex gap-5 py-4">
          <span className="pt-0.5 font-mono text-[11px] text-ember-400 tabular-nums">
            {padIndex(i + 1)}
          </span>
          <span className="text-base leading-relaxed text-fg-100">{item}</span>
        </li>
      ))}
    </ol>
  );
}

/* ----------------------------------------------------------------------------
   Case study
   -------------------------------------------------------------------------- */

type Block = NavSection & { node: React.ReactNode };

export function ProjectCaseStudy({
  project,
  preview = false,
}: {
  project: ProjectWithRelations;
  preview?: boolean;
}) {
  const summary = isSummaryConfidential(project);
  const confidential = project.confidential;
  const links = summary ? [] : actionLinks(project);
  const year = projectYearRange(project);
  const status = project.live_url ? "Live" : "Delivered";

  const heroImageRow = project.images.find((i) => i.type === "hero") ?? null;
  const hero = summary
    ? null
    : project.cover_image
      ? {
          url: project.cover_image,
          alt: project.cover_alt ?? project.title,
          id: null as string | null,
        }
      : heroImageRow
        ? {
            url: heroImageRow.image_url,
            alt: heroImageRow.alt_text ?? project.title,
            id: heroImageRow.id,
          }
        : null;

  const architectureImages = project.images.filter((i) => i.type === "architecture");
  const galleryImages = summary
    ? []
    : project.images
        .filter((i) => i.type !== "architecture" && i.id !== hero?.id)
        .map((i) => toGalleryImage(i, project.title));

  const meta = [
    {
      label: "CLIENT",
      value: confidential ? "Confidential client" : project.client,
    },
    { label: "COMPANY", value: confidential ? null : project.company },
    { label: "ROLE", value: project.role },
    { label: "YEAR", value: year },
    { label: "PLATFORMS", value: project.platforms.length ? project.platforms.join(", ") : null },
    { label: "STATUS", value: status },
  ];

  const overview = project.overview ?? project.full_description;
  const roleText = [project.role, project.company && !confidential ? `at ${project.company}` : null]
    .filter(Boolean)
    .join(" ");

  const blocks: Block[] = summary
    ? [
        ...(project.technologies.length
          ? [{ id: "technology", label: "Technology", node: <TechnologyBlock project={project} /> }]
          : []),
      ]
    : (
        [
          overview && {
            id: "overview",
            label: "Overview",
            node: <Prose text={overview} size="lg" />,
          },
          project.problem && {
            id: "problem",
            label: "Problem",
            node: <Prose text={project.problem} />,
          },
          project.objective && {
            id: "objective",
            label: "Objective",
            node: <Prose text={project.objective} />,
          },
          project.role && {
            id: "role",
            label: "My role",
            node: (
              <div>
                <p className="font-display text-2xl font-medium tracking-tight text-fg-50 sm:text-3xl">
                  {roleText}
                </p>
                {project.project_type || year ? (
                  <p className="mt-4 label-mono">
                    {[project.project_type, year].filter(Boolean).join(" · ")}
                  </p>
                ) : null}
              </div>
            ),
          },
          project.responsibilities.length > 0 && {
            id: "responsibilities",
            label: "Responsibilities",
            node: <ResponsibilitiesBlock items={project.responsibilities} />,
          },
          project.technologies.length > 0 && {
            id: "technology",
            label: "Technology",
            node: <TechnologyBlock project={project} />,
          },
          (project.architecture || architectureImages.length > 0) && {
            id: "architecture",
            label: "Architecture",
            node: (
              <div className="space-y-8">
                <Prose text={project.architecture} />
                <ArchitectureImages images={architectureImages} title={project.title} />
              </div>
            ),
          },
          project.features.length > 0 && {
            id: "features",
            label: "Features",
            node: <FeaturesBlock features={project.features} />,
          },
          project.challenge && {
            id: "challenges",
            label: "Challenges",
            node: <Prose text={project.challenge} />,
          },
          project.solution && {
            id: "solution",
            label: "Solution",
            node: <Prose text={project.solution} />,
          },
          (project.results || project.outcome || project.impact) && {
            id: "results",
            label: "Results",
            node: <ResultsBlock project={project} />,
          },
          galleryImages.length > 0 && {
            id: "screenshots",
            label: "Screenshots",
            node: <ScreenshotGallery images={galleryImages} />,
          },
          links.length > 0 && {
            id: "links",
            label: "Links",
            node: (
              <ul className="divide-y divide-line-800 border-y border-line-800">
                {links.map((l) => (
                  <li key={l.href}>
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex min-h-14 items-center justify-between gap-4 py-3"
                    >
                      <span className="flex items-center gap-3">
                        <l.icon
                          className="h-4 w-4 text-fg-500 transition-colors group-hover:text-ember-400"
                          aria-hidden
                        />
                        <span className="text-sm font-medium text-fg-100">{l.label}</span>
                      </span>
                      <span className="min-w-0 truncate font-mono text-xs text-fg-500 transition-colors group-hover:text-fg-100">
                        {l.href.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ),
          },
        ] as (Block | false | null | "" | 0)[]
      ).filter((b): b is Block => Boolean(b));

  const navSections: NavSection[] = blocks.map(({ id, label }) => ({ id, label }));
  const breadcrumb = [
    { name: "Home", path: "/" },
    { name: "Work", path: "/projects" },
    { name: project.title, path: `/projects/${project.slug}` },
  ];

  return (
    <article>
      {!preview ? (
        <JsonLd data={[creativeWorkJsonLd(project), breadcrumbJsonLd(breadcrumb)]} />
      ) : null}

      {/* Header */}
      <header className="relative overflow-hidden border-b border-line-800">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(60%_60%_at_30%_0%,black,transparent)] opacity-60"
        />
        <div className="relative container-x pt-32 pb-14 sm:pt-40 sm:pb-16 lg:pt-44 lg:pb-20">
          <nav aria-label="Breadcrumb" className="flex items-center gap-2 label-mono">
            <Link href="/projects" className="transition-colors hover:text-fg-100">
              Work
            </Link>
            {project.category ? (
              <>
                <span className="text-fg-700">/</span>
                <span className="text-fg-300">{project.category}</span>
              </>
            ) : null}
            {summary ? (
              <>
                <span className="text-fg-700">/</span>
                <span className="text-amber-300">Confidential</span>
              </>
            ) : null}
          </nav>

          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-end">
            <div className="lg:col-span-8">
              {!summary && project.client_logo?.logo_url ? (
                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-sm border border-line-800 bg-fg-50 p-1.5">
                    <Image
                      src={project.client_logo.logo_url}
                      alt={project.client_logo.name}
                      width={44}
                      height={44}
                      className="h-full w-full object-contain"
                      unoptimized={project.client_logo.logo_url.endsWith(".svg")}
                    />
                  </span>
                  <span className="flex flex-col">
                    <span className="label-mono">Built for</span>
                    {project.client_logo.url ? (
                      <a
                        href={project.client_logo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-fg-100 underline-offset-4 hover:text-fg-50 hover:underline"
                      >
                        {project.client_logo.name}
                      </a>
                    ) : (
                      <span className="text-sm font-medium text-fg-100">
                        {project.client_logo.name}
                      </span>
                    )}
                  </span>
                </div>
              ) : null}
              <h1 className="font-display text-display-lg font-semibold text-balance text-fg-50">
                {project.title}
              </h1>
              {project.short_description ? (
                <p className="mt-6 max-w-2xl text-lg leading-relaxed text-fg-300">
                  {project.short_description}
                </p>
              ) : null}
            </div>
            {links.length ? (
              <div className="lg:col-span-4 lg:justify-self-end">
                <ActionLinks links={links} />
              </div>
            ) : null}
          </div>

          <MetaRow items={meta} className="mt-12 sm:grid-cols-3 lg:grid-cols-6" />
        </div>
      </header>

      {/* Hero */}
      {hero && asCoverFrame(project.cover_frame) !== "none" ? (
        <div className="grain relative w-full border-y border-line-800 bg-bg-900">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 grid-lines [mask-image:radial-gradient(70%_80%_at_50%_50%,black,transparent)]"
          />
          <div className="relative container-x flex justify-center py-12 sm:py-16 lg:py-24">
            <DeviceFrame
              frame={asCoverFrame(project.cover_frame)}
              src={hero.url}
              alt={hero.alt}
              sizes="(max-width: 1024px) 100vw, 1100px"
              priority
              className={
                asCoverFrame(project.cover_frame) === "phone"
                  ? "h-[70svh] max-h-[760px] w-auto"
                  : "max-w-4xl"
              }
            />
          </div>
        </div>
      ) : hero ? (
        <div className="grain relative w-full">
          <div className="relative aspect-[16/10] w-full overflow-hidden bg-surface-900 lg:aspect-[21/9]">
            <Image
              src={hero.url}
              alt={hero.alt}
              fill
              priority
              sizes="100vw"
              unoptimized={!isOptimizableImage(hero.url)}
              className="object-cover"
            />
          </div>
        </div>
      ) : null}

      {/* Body */}
      <div className="container-x py-16 sm:py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {blocks.length > 1 ? (
            <aside className="hidden lg:col-span-3 lg:block">
              <SectionNav sections={navSections} className="sticky top-28" />
            </aside>
          ) : null}
          <div
            className={cn(
              "min-w-0",
              blocks.length > 1 ? "lg:col-span-8 lg:col-start-5" : "lg:col-span-9",
            )}
          >
            {blocks.map((b, i) => (
              <section
                key={b.id}
                id={b.id}
                aria-labelledby={`${b.id}-title`}
                className={cn(
                  "scroll-mt-28",
                  i > 0 && "mt-14 border-t border-line-800 pt-14 sm:mt-16 sm:pt-16",
                )}
              >
                <div className="mb-6 flex items-baseline gap-4 sm:mb-8">
                  <Eyebrow index={i + 1}>{b.label}</Eyebrow>
                </div>
                <h2 id={`${b.id}-title`} className="sr-only">
                  {b.label}
                </h2>
                {b.node}
              </section>
            ))}

            {summary ? (
              <div
                className={cn(
                  "rounded-md border border-line-800 bg-surface-900 p-6 sm:p-8",
                  blocks.length > 0 && "mt-14 sm:mt-16",
                )}
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-line-700 bg-surface-800">
                    <Lock className="h-4 w-4 text-amber-300" aria-hidden />
                  </span>
                  <div>
                    <p className="label-mono text-amber-300">Confidential client project</p>
                    <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight text-fg-50">
                      Details available on request.
                    </h2>
                    <p className="mt-3 max-w-lg text-sm leading-relaxed text-fg-300">
                      This work was delivered under NDA. The stack and scope above are public; the
                      client, screenshots and implementation details can be discussed directly.
                    </p>
                    <div className="mt-6">
                      <ButtonLink href="/contact" variant="primary">
                        Ask about this project
                      </ButtonLink>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}
