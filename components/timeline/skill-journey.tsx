import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { padIndex } from "@/lib/utils/format";
import type { SkillMilestone } from "@/types";

/**
 * Skill milestones: horizontal rail with periods on lg, vertical rail below.
 */
export function SkillJourney({ milestones }: { milestones: SkillMilestone[] }) {
  if (!milestones.length) return null;
  const cols = Math.min(milestones.length, 4);
  return (
    <ol
      className={cn(
        "relative grid gap-10 lg:gap-8",
        cols === 1 && "lg:grid-cols-1",
        cols === 2 && "lg:grid-cols-2",
        cols === 3 && "lg:grid-cols-3",
        cols >= 4 && "lg:grid-cols-4",
      )}
    >
      {/* vertical rail (mobile) / horizontal rail (lg) */}
      <span
        aria-hidden
        className="absolute top-3 bottom-3 left-[11px] w-px bg-line-700 lg:hidden"
      />
      <span
        aria-hidden
        className="absolute top-[11px] right-0 left-0 hidden h-px bg-line-700 lg:block"
      />

      {milestones.map((m, i) => (
        <li key={m.id} className="relative pl-10 lg:pt-10 lg:pl-0">
          <Reveal delay={i * 0.06}>
            <span
              aria-hidden
              className="absolute top-0 left-0 flex h-6 w-6 items-center justify-center rounded-full border border-ember-500 bg-bg-950 lg:top-0 lg:left-0"
            >
              <span className="h-2 w-2 rounded-full bg-ember-500" />
            </span>
            <p className="flex items-center gap-3 label-mono text-ember-400">
              <span className="text-fg-500 tabular-nums">{padIndex(i + 1)}</span>
              {m.period_label}
            </p>
            <h3 className="mt-3 font-display text-xl font-semibold tracking-tight text-fg-50">
              {m.title}
            </h3>
            {m.description ? (
              <p className="mt-3 text-sm leading-relaxed text-fg-300">{m.description}</p>
            ) : null}
            {m.technologies.length ? (
              <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Technologies">
                {m.technologies.map((t) => (
                  <li key={t}>
                    <Badge tone="outline">{t}</Badge>
                  </li>
                ))}
              </ul>
            ) : null}
          </Reveal>
        </li>
      ))}
    </ol>
  );
}
