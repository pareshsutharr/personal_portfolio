"use client";

import * as React from "react";
import { cn } from "@/lib/utils/cn";
import { padIndex } from "@/lib/utils/format";

export type NavSection = { id: string; label: string };

/**
 * Sticky in-page navigation for the case study (lg+). Tracks the section
 * currently in view with an IntersectionObserver.
 */
export function SectionNav({
  sections,
  className,
}: {
  sections: NavSection[];
  className?: string;
}) {
  const [active, setActive] = React.useState<string | null>(sections[0]?.id ?? null);

  React.useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    const els = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;

    const ratios = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries)
          ratios.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
        // Pick the first visible section in document order; fall back to the
        // nearest one above the viewport so the rail never goes blank.
        const firstVisible = els.find((el) => (ratios.get(el.id) ?? 0) > 0);
        if (firstVisible) {
          setActive(firstVisible.id);
          return;
        }
        const above = [...els].reverse().find((el) => el.getBoundingClientRect().top < 0);
        if (above) setActive(above.id);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.1, 0.5] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [sections]);

  if (!sections.length) return null;

  return (
    <nav aria-label="On this page" className={cn("text-sm", className)}>
      <p className="mb-5 label-mono">Contents</p>
      <ol className="space-y-0.5 border-l border-line-800">
        {sections.map((s, i) => {
          const isActive = s.id === active;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? "location" : undefined}
                className={cn(
                  "-ml-px flex min-h-9 items-center gap-3 border-l py-1.5 pl-4 transition-colors duration-300",
                  isActive
                    ? "border-ember-500 text-fg-50"
                    : "border-transparent text-fg-500 hover:text-fg-100",
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[10px] tabular-nums",
                    isActive ? "text-ember-400" : "text-fg-700",
                  )}
                >
                  {padIndex(i + 1)}
                </span>
                {s.label}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
