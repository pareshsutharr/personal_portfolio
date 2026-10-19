"use client";

import * as React from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils/cn";
import { SKILL_CATEGORY_LABELS, type SkillCategory, type SkillWithProjects } from "@/types";
import { projectRoute } from "./routes";

const CATEGORY_ORDER = Object.keys(SKILL_CATEGORY_LABELS) as SkillCategory[];
const EASE = [0.16, 1, 0.3, 1] as const;

function nodePosition(i: number, n: number, radius: number) {
  const angle = (-90 + (360 / n) * i) * (Math.PI / 180);
  // Rounded so server and client markup agree (float noise differs per engine).
  const round = (v: number) => Math.round(v * 100) / 100;
  return { x: round(50 + radius * Math.cos(angle)), y: round(50 + radius * Math.sin(angle)) };
}

/**
 * Interactive radial diagram: center node → skill categories → technologies →
 * projects using them. Keyboard accessible; collapses to a chip row on mobile.
 */
export function TechEcosystem({
  skills,
  compact = false,
}: {
  skills: SkillWithProjects[];
  compact?: boolean;
}) {
  const reduce = useReducedMotion();
  const categories = React.useMemo(
    () => CATEGORY_ORDER.filter((c) => skills.some((s) => s.category === c)),
    [skills],
  );
  const [active, setActive] = React.useState<SkillCategory | null>(categories[0] ?? null);
  const [openChip, setOpenChip] = React.useState<string | null>(null);
  const panelId = React.useId();

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenChip(null);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  if (!categories.length) return null;

  const current = active && categories.includes(active) ? active : categories[0];
  const visible = skills.filter((s) => s.category === current);
  const radius = compact ? 36 : 40;

  const selectCategory = (c: SkillCategory) => {
    setActive(c);
    setOpenChip(null);
  };

  return (
    <div className={cn("flex flex-col", compact ? "gap-8" : "gap-10 lg:gap-14")}>
      {/* Mobile: horizontal chip row */}
      <div className="-mx-4 no-scrollbar overflow-x-auto px-4 md:hidden">
        <div role="tablist" aria-label="Skill categories" className="flex w-max gap-2">
          {categories.map((c) => {
            const selected = c === current;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                onClick={() => selectCategory(c)}
                className={cn(
                  "min-h-11 rounded-sm border px-4 label-mono transition-colors",
                  selected
                    ? "border-ember-500 bg-ember-500/10 text-fg-50"
                    : "border-line-700 text-fg-300 hover:border-line-600 hover:text-fg-50",
                )}
              >
                {SKILL_CATEGORY_LABELS[c]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Desktop: radial diagram */}
      <div
        role="tablist"
        aria-label="Skill categories"
        className={cn(
          "relative mx-auto hidden w-full md:block",
          compact ? "max-w-[440px]" : "max-w-[560px]",
        )}
      >
        <div className="relative aspect-square w-full">
          <svg
            aria-hidden
            viewBox="0 0 100 100"
            className="pointer-events-none absolute inset-0 h-full w-full overflow-visible"
          >
            {categories.map((c, i) => {
              const p = nodePosition(i, categories.length, radius);
              const on = c === current;
              return (
                <line
                  key={c}
                  x1={50}
                  y1={50}
                  x2={p.x}
                  y2={p.y}
                  stroke={on ? "var(--color-ember-500)" : "var(--color-line-700)"}
                  strokeWidth={on ? 0.35 : 0.2}
                  vectorEffect="non-scaling-stroke"
                  style={{ transition: "stroke 300ms" }}
                />
              );
            })}
            <circle
              cx={50}
              cy={50}
              r={radius}
              fill="none"
              stroke="var(--color-line-800)"
              strokeWidth={0.15}
              strokeDasharray="0.6 1.2"
            />
          </svg>

          {/* Center node */}
          <div
            aria-hidden
            className="absolute top-1/2 left-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-line-700 bg-bg-950"
          >
            <span className="font-display text-sm font-semibold tracking-tight text-fg-50">
              PARESH
            </span>
            <span className="mt-1 label-mono text-[9px] text-ember-400">
              {SKILL_CATEGORY_LABELS[current]}
            </span>
          </div>

          {/* Category nodes */}
          {categories.map((c, i) => {
            const p = nodePosition(i, categories.length, radius);
            const selected = c === current;
            return (
              <button
                key={c}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                onClick={() => selectCategory(c)}
                onFocus={() => selectCategory(c)}
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
                className={cn(
                  "absolute flex min-h-11 -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-sm border px-3 transition-colors",
                  selected
                    ? "border-ember-500 bg-bg-950 text-fg-50"
                    : "border-line-700 bg-bg-950 text-fg-300 hover:border-line-600 hover:text-fg-50",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    selected ? "bg-ember-500" : "bg-fg-700",
                  )}
                />
                <span className="font-mono text-[11px] tracking-[0.14em] uppercase">
                  {SKILL_CATEGORY_LABELS[c]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Technologies for the active category */}
      <div id={panelId} role="tabpanel" aria-live="polite" className="min-h-[88px]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <p className="mb-4 flex items-center gap-3 label-mono">
              <span className="text-ember-400">{SKILL_CATEGORY_LABELS[current]}</span>
              <span aria-hidden className="h-px w-6 bg-line-700" />
              <span>
                {visible.length} {visible.length === 1 ? "technology" : "technologies"}
              </span>
            </p>
            <ul className="flex flex-wrap gap-2">
              {visible.map((skill) => {
                const hasProjects = skill.projects.length > 0;
                const open = openChip === skill.id;
                const popId = `${panelId}-${skill.id}`;
                return (
                  <li
                    key={skill.id}
                    className="relative"
                    onMouseEnter={() => hasProjects && setOpenChip(skill.id)}
                    onMouseLeave={() => setOpenChip((v) => (v === skill.id ? null : v))}
                    onBlur={(e) => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                        setOpenChip((v) => (v === skill.id ? null : v));
                      }
                    }}
                  >
                    {hasProjects ? (
                      <button
                        type="button"
                        aria-expanded={open}
                        aria-controls={popId}
                        onClick={() => setOpenChip(open ? null : skill.id)}
                        onFocus={() => setOpenChip(skill.id)}
                        className={cn(
                          "flex min-h-11 items-center gap-2 rounded-sm border px-3 text-sm transition-colors",
                          open
                            ? "border-ember-500 text-fg-50"
                            : "border-line-700 text-fg-100 hover:border-line-600",
                        )}
                      >
                        {skill.name}
                        <span className="label-mono text-ember-400">{skill.projects.length}</span>
                      </button>
                    ) : (
                      <span className="flex min-h-11 items-center rounded-sm border border-line-800 px-3 text-sm text-fg-300">
                        {skill.name}
                      </span>
                    )}

                    <AnimatePresence>
                      {open && hasProjects ? (
                        <motion.div
                          id={popId}
                          role="group"
                          aria-label={`Projects using ${skill.name}`}
                          initial={reduce ? false : { opacity: 0, y: 6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={reduce ? undefined : { opacity: 0, y: 6 }}
                          transition={{ duration: 0.2, ease: EASE }}
                          className="absolute top-full left-0 z-20 mt-2 w-64 rounded-sm border border-line-700 bg-surface-900 p-2 shadow-panel"
                        >
                          <p className="px-2 pt-1 pb-2 label-mono">Used in</p>
                          <ul className="flex flex-col">
                            {skill.projects.slice(0, 6).map((p) => (
                              <li key={p.id}>
                                <Link
                                  href={projectRoute(p.slug)}
                                  className="flex min-h-10 items-center rounded-xs px-2 text-sm text-fg-100 transition-colors hover:bg-surface-800 hover:text-fg-50"
                                >
                                  {p.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
