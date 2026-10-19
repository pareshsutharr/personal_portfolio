import Image from "next/image";
import { DeviceFrame, asCoverFrame } from "@/components/projects/device-frame";
import { Tilt } from "@/components/motion/tilt";
import Link from "next/link";
import type { Route } from "next";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { padIndex, yearOf } from "@/lib/utils/format";
import { initials, isOptimizableImage } from "@/lib/utils/image";
import type { ProjectWithRelations } from "@/types";

export type CardSpan = "wide" | "narrow" | "full";

const SPAN_CLASS: Record<CardSpan, string> = {
  wide: "lg:col-span-7",
  narrow: "lg:col-span-5",
  full: "lg:col-span-12",
};

const ASPECT_CLASS: Record<CardSpan, string> = {
  wide: "aspect-[16/10]",
  narrow: "aspect-[4/3]",
  full: "aspect-[16/10] lg:aspect-[21/9]",
};

const SIZES: Record<CardSpan, string> = {
  wide: "(min-width: 1024px) 58vw, (min-width: 768px) 50vw, 100vw",
  narrow: "(min-width: 1024px) 42vw, (min-width: 768px) 50vw, 100vw",
  full: "100vw",
};

export const MAX_CHIPS = 4;

export function projectYear(
  p: Pick<ProjectWithRelations, "year_label" | "start_date" | "end_date">,
) {
  return p.year_label ?? yearOf(p.end_date) ?? yearOf(p.start_date);
}

export function isSummaryConfidential(
  p: Pick<ProjectWithRelations, "confidential" | "confidential_mode">,
) {
  return p.confidential && p.confidential_mode === "summary";
}

function Placeholder({
  index,
  title,
  confidential,
}: {
  index: number;
  title: string;
  confidential: boolean;
}) {
  return (
    <div
      aria-hidden
      className="absolute inset-0 flex flex-col justify-between bg-surface-900 grid-lines [background-size:40px_40px] p-5"
    >
      <div className="flex items-start justify-between">
        <span className="label-mono text-fg-700">
          {confidential ? "CONFIDENTIAL" : "NO PREVIEW"}
        </span>
        <span className="h-px w-8 bg-ember-500" />
      </div>
      <span className="self-center font-display text-[clamp(3rem,10vw,5.5rem)] leading-none font-semibold tracking-tighter text-fg-700 select-none">
        {initials(title)}
      </span>
      <span className="font-mono text-xs text-fg-700 tabular-nums">{padIndex(index)}</span>
    </div>
  );
}

export function ProjectCard({
  project,
  index,
  span = "narrow",
  priority = false,
  className,
}: {
  project: ProjectWithRelations;
  index: number;
  span?: CardSpan;
  priority?: boolean;
  className?: string;
}) {
  const summary = isSummaryConfidential(project);
  const image = summary ? null : (project.cover_image ?? project.thumbnail);
  const year = projectYear(project);
  const status = project.live_url ? "Production" : "Delivered";
  const chips = project.technologies.slice(0, MAX_CHIPS);
  const extra = project.technologies.length - chips.length;
  const meta = [
    { label: "ROLE", value: project.role },
    { label: "YEAR", value: year },
    { label: "BUILD STATUS", value: status },
  ].filter((m) => Boolean(m.value));

  return (
    <article className={cn("group relative flex flex-col", SPAN_CLASS[span], className)}>
      <Link
        href={`/projects/${project.slug}` as Route}
        data-cursor="view"
        className="flex h-full flex-col rounded-xs focus-visible:outline-offset-4"
        aria-label={`${project.title} — view case study`}
      >
        <Tilt
          className={cn(
            "relative overflow-hidden rounded-sm border border-line-800 bg-surface-900",
            ASPECT_CLASS[span],
          )}
        >
          {image && asCoverFrame(project.cover_frame) !== "none" ? (
            <div className="absolute inset-0 flex items-center justify-center grid-lines [mask-image:radial-gradient(85%_85%_at_50%_50%,black,transparent)] p-4 sm:p-6">
              <div className="flex h-full w-full items-center justify-center transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100">
                <DeviceFrame
                  frame={asCoverFrame(project.cover_frame)}
                  src={image}
                  alt={project.cover_alt ?? project.title}
                  sizes={SIZES[span]}
                  priority={priority}
                  className={
                    asCoverFrame(project.cover_frame) === "phone" ? "h-full w-auto" : "max-w-full"
                  }
                />
              </div>
            </div>
          ) : image ? (
            <Image
              src={image}
              alt={project.cover_alt ?? project.title}
              fill
              sizes={SIZES[span]}
              priority={priority}
              unoptimized={!isOptimizableImage(image)}
              className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
          ) : (
            <Placeholder index={index} title={project.title} confidential={summary} />
          )}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        </Tilt>

        <div className="mt-5 flex items-center justify-between gap-4">
          <p className="label-mono">
            <span className="text-fg-300 tabular-nums transition-colors duration-300 group-hover:text-ember-400">
              {padIndex(index)}
            </span>
            {project.category ? (
              <>
                <span className="mx-2 text-fg-700">/</span>
                <span>{project.category}</span>
              </>
            ) : null}
          </p>
          {summary ? (
            <Badge tone="amber" mono>
              Confidential
            </Badge>
          ) : project.featured ? (
            <span className="label-mono text-ember-400">Featured</span>
          ) : null}
        </div>

        <h3
          className={cn(
            "mt-3 font-display font-semibold tracking-tight text-balance text-fg-50",
            span === "wide" || span === "full" ? "text-2xl sm:text-3xl" : "text-xl sm:text-2xl",
          )}
        >
          {project.title}
        </h3>

        {project.short_description ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-fg-300 sm:text-[0.9375rem]">
            {project.short_description}
          </p>
        ) : null}

        {chips.length ? (
          <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
            {chips.map((t) => (
              <li key={t.id}>
                <Badge tone="outline">{t.name}</Badge>
              </li>
            ))}
            {extra > 0 ? (
              <li>
                <Badge tone="neutral" mono>
                  +{extra}
                </Badge>
              </li>
            ) : null}
          </ul>
        ) : null}

        {meta.length ? (
          <dl className="mt-auto grid grid-cols-3 gap-4 border-t border-line-800 pt-4">
            {meta.map((m) => (
              <div key={m.label} className="min-w-0">
                <dt className="label-mono text-[0.625rem]">{m.label}</dt>
                <dd className="mt-1.5 truncate text-xs text-fg-100">{m.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Link>
    </article>
  );
}

/** Confidential-aware label for client/company. */
export function clientLabel(p: Pick<ProjectWithRelations, "confidential" | "client">) {
  if (p.confidential) return "Confidential client";
  return p.client;
}
