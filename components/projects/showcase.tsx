"use client";

import * as React from "react";
import Image from "next/image";
import { DeviceFrame, asCoverFrame, type CoverFrame } from "@/components/projects/device-frame";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ButtonLink } from "@/components/ui/button";
import { ROUTES, projectRoute } from "@/components/portfolio/routes";
import { Section, SectionHeader } from "@/components/portfolio/section";
import { cn } from "@/lib/utils/cn";
import { padIndex, yearOf } from "@/lib/utils/format";
import type { ProjectWithRelations } from "@/types";

const EASE = [0.16, 1, 0.3, 1] as const;

type View = {
  id: string;
  index: number;
  slug: string;
  title: string;
  category: string | null;
  description: string | null;
  image: string | null;
  imageAlt: string;
  frame: CoverFrame;
  confidentialLabel: string | null;
  meta: { label: string; value: string }[];
};

function toView(p: ProjectWithRelations, i: number): View {
  const summary = p.confidential && p.confidential_mode === "summary";
  const tech = p.technologies.slice(0, 4).map((t) => t.name);
  const year = p.year_label || yearOf(p.end_date || p.start_date);
  const meta: { label: string; value: string }[] = [
    { label: "Status", value: !summary && p.live_url ? "Live" : "Delivered" },
  ];
  if (tech.length) meta.push({ label: "Tech stack", value: tech.join(", ") });
  if (p.role) meta.push({ label: "Role", value: p.role });
  if (year) meta.push({ label: "Year", value: year });
  return {
    id: p.id,
    index: i,
    slug: p.slug,
    title: p.title,
    category: p.category,
    description: p.short_description,
    image: summary ? null : p.cover_image || p.thumbnail,
    imageAlt: p.cover_alt || p.title,
    frame: asCoverFrame(p.cover_frame),
    confidentialLabel: p.confidential
      ? summary
        ? "Confidential client project"
        : "Confidential client"
      : null,
    meta,
  };
}

function initials(title: string) {
  return title
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function Cover({ view, sizes, eager }: { view: View; sizes: string; eager?: boolean }) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-surface-900">
      <div className="grain relative h-full w-full grid-lines [mask-image:radial-gradient(80%_80%_at_50%_50%,black,transparent)] [background-position:center]" />
      <div className="absolute inset-0 p-5 sm:p-8 lg:p-10">
        {view.image && view.frame !== "none" ? (
          <div className="flex h-full w-full items-center justify-center transition-transform duration-700 ease-out-expo group-hover:scale-[1.02]">
            <DeviceFrame
              frame={view.frame}
              src={view.image}
              alt={view.imageAlt}
              sizes={sizes}
              priority={eager}
              className={view.frame === "phone" ? "h-full w-auto" : "max-w-full"}
            />
          </div>
        ) : view.image ? (
          <div className="relative h-full w-full">
            <Image
              src={view.image}
              alt={view.imageAlt}
              fill
              sizes={sizes}
              loading={eager ? "eager" : "lazy"}
              className="object-contain transition-transform duration-700 ease-out-expo group-hover:scale-[1.02]"
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col justify-between grid-lines p-6">
            <div className="flex items-center justify-between label-mono">
              <span>{view.confidentialLabel ? "CONFIDENTIAL" : "NO COVER"}</span>
              <span className="text-ember-400">{padIndex(view.index + 1)}</span>
            </div>
            <span className="font-display text-[clamp(4rem,14vw,10rem)] leading-none font-bold tracking-tighter text-fg-50/90">
              {initials(view.title)}
            </span>
            <span className="label-mono">{view.title.toUpperCase()}</span>
          </div>
        )}
      </div>
      <span
        aria-hidden
        className="absolute top-3 left-3 h-4 w-4 border-t border-l border-ember-500"
      />
      <span
        aria-hidden
        className="absolute right-3 bottom-3 h-4 w-4 border-r border-b border-ember-500"
      />
    </div>
  );
}

function Meta({ view, className }: { view: View; className?: string }) {
  return (
    <dl className={cn("grid grid-cols-2 gap-x-6 gap-y-4", className)}>
      {view.meta.map((m) => (
        <div key={m.label}>
          <dt className="label-mono">{m.label}</dt>
          <dd className="mt-1.5 text-sm text-fg-100">{m.value}</dd>
        </div>
      ))}
    </dl>
  );
}

function Details({ view, total }: { view: View; total: number }) {
  return (
    <>
      <p className="flex items-center gap-3 label-mono">
        <span className="text-ember-400">{padIndex(view.index + 1)}</span>
        <span aria-hidden className="h-px w-6 bg-line-700" />
        <span>
          {padIndex(view.index + 1)} / {padIndex(total)}
        </span>
      </p>
      <h3 className="mt-6 font-display text-display-md font-semibold tracking-tight text-balance text-fg-50">
        <Link
          href={projectRoute(view.slug)}
          data-cursor="view"
          className="group/title inline-flex items-start gap-2"
        >
          {view.title}
          <ArrowUpRight
            className="mt-[0.3em] h-[0.5em] w-[0.5em] shrink-0 text-fg-500 transition-colors group-hover/title:text-ember-400"
            aria-hidden
          />
        </Link>
      </h3>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 label-mono">
        {view.category ? <span>{view.category}</span> : null}
        {view.confidentialLabel ? (
          <span className="text-ember-400">{view.confidentialLabel}</span>
        ) : null}
      </div>
      {view.description ? (
        <p className="mt-6 max-w-md text-base leading-relaxed text-fg-300">{view.description}</p>
      ) : null}
      <Meta view={view} className="mt-8 border-t border-line-800 pt-6" />
    </>
  );
}

/**
 * SELECTED WORK. Desktop: sticky detail column on the left, tall scrolling cover
 * panels on the right drive the active project. Mobile: plain vertical stack.
 */
export function Showcase({ projects, index }: { projects: ProjectWithRelations[]; index: number }) {
  const reduce = useReducedMotion();
  const views = React.useMemo(() => projects.map(toView), [projects]);
  const [activeId, setActiveId] = React.useState<string | null>(views[0]?.id ?? null);
  const panelRefs = React.useRef(new Map<string, HTMLElement>());

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const mq = window.matchMedia("(min-width: 1024px)");
    let observer: IntersectionObserver | null = null;

    const connect = () => {
      observer?.disconnect();
      observer = null;
      if (!mq.matches) return;
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              const id = (entry.target as HTMLElement).dataset.projectId;
              if (id) setActiveId(id);
            }
          }
        },
        { rootMargin: "-45% 0px -45% 0px", threshold: 0 },
      );
      panelRefs.current.forEach((el) => observer?.observe(el));
    };
    connect();
    mq.addEventListener("change", connect);
    return () => {
      mq.removeEventListener("change", connect);
      observer?.disconnect();
    };
  }, [views]);

  if (!views.length) return null;
  const active = views.find((v) => v.id === activeId) ?? views[0];

  return (
    <Section id="work" className="bg-bg-950">
      <SectionHeader
        index={index}
        eyebrow="Selected work"
        title="Recent projects."
        action={
          <ButtonLink href={ROUTES.projects} variant="outline" className="hidden lg:inline-flex">
            All projects
          </ButtonLink>
        }
      />

      {/* Desktop */}
      <div className="hidden lg:grid lg:grid-cols-12 lg:gap-12">
        <div className="lg:col-span-5">
          <div className="sticky top-32">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={active.id}
                initial={reduce ? false : { opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={reduce ? undefined : { opacity: 0, y: -14 }}
                transition={{ duration: 0.4, ease: EASE }}
              >
                <Details view={active} total={views.length} />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex flex-col gap-10 lg:col-span-7">
          {views.map((v, i) => (
            <Link
              key={v.id}
              href={projectRoute(v.slug)}
              data-cursor="view"
              aria-label={`${v.title} — view project`}
              ref={(el) => {
                if (el) panelRefs.current.set(v.id, el);
                else panelRefs.current.delete(v.id);
              }}
              data-project-id={v.id}
              className={cn(
                "group relative block aspect-[4/3] max-h-[78vh] w-full overflow-hidden border border-line-800 transition-opacity duration-500",
                active.id === v.id ? "opacity-100" : "opacity-50",
              )}
            >
              <Cover view={v} sizes="(max-width: 1024px) 100vw, 55vw" eager={i === 0} />
            </Link>
          ))}
        </div>
      </div>

      {/* Mobile / tablet */}
      <ol className="flex flex-col gap-16 lg:hidden">
        {views.map((v) => (
          <li key={v.id}>
            <Link
              href={projectRoute(v.slug)}
              data-cursor="view"
              aria-label={`${v.title} — view project`}
              className="group relative block aspect-[16/10] w-full overflow-hidden border border-line-800"
            >
              <Cover view={v} sizes="100vw" />
            </Link>
            <div className="mt-6">
              <Details view={v} total={views.length} />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-14 lg:hidden">
        <ButtonLink href={ROUTES.projects} variant="outline" size="lg" className="w-full sm:w-auto">
          All projects
        </ButtonLink>
      </div>
    </Section>
  );
}
