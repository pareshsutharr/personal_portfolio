"use client";

import * as React from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import type { ProjectWithRelations } from "@/types";
import { ProjectCard, type CardSpan } from "./project-card";

export const PROJECT_FILTERS = [
  "All",
  "Fintech",
  "Healthcare",
  "HRMS",
  "CRM",
  "Mobile",
  "E-commerce",
  "Travel",
  "Marketplace",
  "Corporate",
] as const;

type Filter = (typeof PROJECT_FILTERS)[number];

const MOBILE_PLATFORM = /\b(ios|android|mobile|react native|flutter)\b/i;

function norm(v: string | null | undefined) {
  return (v ?? "").toLowerCase();
}

function matchesFilter(p: ProjectWithRelations, filter: Filter): boolean {
  if (filter === "All") return true;
  const hay = [p.category, p.industry?.name, p.project_type, ...p.platforms].map(norm).join(" | ");
  if (filter === "Mobile") {
    return p.platforms.some((pl) => MOBILE_PLATFORM.test(pl)) || hay.includes("mobile");
  }
  if (filter === "E-commerce") {
    return hay.includes("e-commerce") || hay.includes("ecommerce") || hay.includes("e commerce");
  }
  return hay.includes(filter.toLowerCase());
}

function matchesQuery(p: ProjectWithRelations, q: string): boolean {
  if (!q) return true;
  const fields = [
    p.title,
    p.category,
    p.industry?.name,
    ...p.technologies.map((t) => t.name),
    ...(p.confidential ? [] : [p.client, p.company]),
  ];
  const hay = fields.map(norm).join(" | ");
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

/** Editorial 12-col rhythm: each row of two sums to 12; featured gets the wide slot. */
function computeSpans(list: ProjectWithRelations[]): CardSpan[] {
  const spans: CardSpan[] = [];
  for (let i = 0; i < list.length; i += 2) {
    const a = list[i];
    const b = list[i + 1];
    if (!b) {
      spans.push(list.length === 1 ? "full" : "wide");
      break;
    }
    const row = i / 2;
    let aWide: boolean;
    if (a.featured && !b.featured) aWide = true;
    else if (!a.featured && b.featured) aWide = false;
    else aWide = row % 2 === 0;
    spans.push(aWide ? "wide" : "narrow", aWide ? "narrow" : "wide");
  }
  return spans;
}

function isFilter(v: string | null): v is Filter {
  return PROJECT_FILTERS.includes((v ?? "") as Filter);
}

/**
 * Reads `?filter=&q=` from the address bar after hydration. The server always
 * renders the full list (this page is ISR-static), so we deliberately avoid
 * `useSearchParams`, which would push the whole grid to client-side rendering.
 */
function readUrlState(): { filter: Filter; q: string } {
  const params = new URLSearchParams(window.location.search);
  const f = params.get("filter");
  return { filter: isFilter(f) ? f : "All", q: params.get("q") ?? "" };
}

function writeUrlState(filter: Filter, q: string) {
  const params = new URLSearchParams();
  if (filter !== "All") params.set("filter", filter);
  if (q.trim()) params.set("q", q.trim());
  const next = params.toString();
  if (next === window.location.search.replace(/^\?/, "")) return;
  const url = `${window.location.pathname}${next ? `?${next}` : ""}${window.location.hash}`;
  // Next.js syncs its router with native history.replaceState; no scroll jump.
  window.history.replaceState(window.history.state, "", url);
}

export function ProjectFilters({ projects }: { projects: ProjectWithRelations[] }) {
  const [filter, setFilter] = React.useState<Filter>("All");
  const [q, setQ] = React.useState("");
  const [hydrated, setHydrated] = React.useState(false);
  const deferredQ = React.useDeferredValue(q.trim());
  const inputId = React.useId();

  // Adopt URL state once on mount.
  React.useEffect(() => {
    const initial = readUrlState();
    React.startTransition(() => {
      setFilter(initial.filter);
      setQ(initial.q);
      setHydrated(true);
    });
  }, []);

  // URL sync (debounced, replace, no scroll).
  React.useEffect(() => {
    if (!hydrated) return;
    const id = window.setTimeout(() => writeUrlState(filter, q), 200);
    return () => window.clearTimeout(id);
  }, [filter, q, hydrated]);

  const visible = React.useMemo(
    () => projects.filter((p) => matchesFilter(p, filter) && matchesQuery(p, deferredQ)),
    [projects, filter, deferredQ],
  );
  const spans = React.useMemo(() => computeSpans(visible), [visible]);
  const counts = React.useMemo(() => {
    const map = new Map<Filter, number>();
    for (const f of PROJECT_FILTERS) map.set(f, projects.filter((p) => matchesFilter(p, f)).length);
    return map;
  }, [projects]);

  const reset = () => {
    setFilter("All");
    setQ("");
  };

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div
          role="group"
          aria-label="Filter by category"
          className="-mx-4 no-scrollbar flex gap-2 overflow-x-auto px-4 pb-1 sm:-mx-6 sm:px-6 lg:mx-0 lg:flex-wrap lg:px-0"
        >
          {PROJECT_FILTERS.map((f) => {
            const active = f === filter;
            const count = counts.get(f) ?? 0;
            return (
              <button
                key={f}
                type="button"
                aria-pressed={active}
                disabled={count === 0 && !active}
                onClick={() => setFilter(f)}
                className={cn(
                  "inline-flex h-10 shrink-0 items-center gap-2 rounded-sm border px-3.5 text-sm transition-colors duration-200",
                  active
                    ? "border-ember-500 bg-ember-500/10 text-fg-50"
                    : "border-line-700 text-fg-300 hover:border-line-600 hover:text-fg-50",
                  "disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-line-700 disabled:hover:text-fg-300",
                )}
              >
                {f}
                <span
                  className={cn(
                    "font-mono text-[10px] tabular-nums",
                    active ? "text-ember-300" : "text-fg-500",
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:max-w-xs">
          <label htmlFor={inputId} className="sr-only">
            Search projects
          </label>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-500"
          />
          <Input
            id={inputId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, stack, client…"
            autoComplete="off"
            className="pr-9 pl-9"
          />
          {q ? (
            <button
              type="button"
              aria-label="Clear search"
              onClick={() => setQ("")}
              className="absolute top-1/2 right-1 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-xs text-fg-500 transition-colors hover:text-fg-100"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-line-800 pt-4">
        <p className="label-mono" aria-live="polite">
          <span className="text-fg-100 tabular-nums">
            {String(visible.length).padStart(2, "0")}
          </span>
          <span className="mx-2 text-fg-700">/</span>
          <span className="tabular-nums">{String(projects.length).padStart(2, "0")}</span>
          <span className="ml-3">Projects</span>
          {filter !== "All" ? <span className="ml-3 text-ember-400">— {filter}</span> : null}
        </p>
        {filter !== "All" || q ? (
          <button
            type="button"
            onClick={reset}
            className="min-h-11 label-mono transition-colors hover:text-fg-100"
          >
            Clear
          </button>
        ) : null}
      </div>

      {visible.length ? (
        <div className="mt-10 grid grid-cols-1 gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-12 lg:gap-y-20">
          {visible.map((p, i) => (
            <ProjectCard
              key={p.id}
              project={p}
              index={projects.indexOf(p) + 1}
              span={spans[i]}
              priority={i < 2}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-10"
          title="No projects match."
          description="Try another category or a shorter search term."
          action={
            <Button variant="outline" size="sm" onClick={reset}>
              Clear filters
            </Button>
          }
        />
      )}
    </div>
  );
}
