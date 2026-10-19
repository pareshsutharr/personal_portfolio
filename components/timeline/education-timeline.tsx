import Image from "next/image";
import { Reveal } from "@/components/motion/reveal";
import { formatPeriod } from "@/lib/utils/format";
import { initials, isOptimizableImage } from "@/lib/utils/image";
import type { Education } from "@/types";

export function EducationTimeline({ education }: { education: Education[] }) {
  if (!education.length) return null;
  return (
    <ol className="relative">
      <span aria-hidden className="absolute top-3 bottom-3 left-[11px] w-px bg-line-700" />
      {education.map((edu, i) => {
        const period = formatPeriod({
          periodLabel: edu.period_label,
          startDate: edu.start_date,
          endDate: edu.end_date,
        });
        const degree = [edu.degree, edu.field].filter(Boolean).join(" · ");
        return (
          <li key={edu.id} className={i > 0 ? "mt-8" : undefined}>
            <Reveal className="relative pl-10">
              <span
                aria-hidden
                className="absolute top-1.5 left-[6px] h-3 w-3 rounded-full border border-line-600 bg-bg-950"
              />
              <div className="flex items-start gap-4">
                {edu.logo ? (
                  <span className="relative block h-10 w-10 shrink-0 overflow-hidden rounded-sm border border-line-700 bg-surface-800">
                    <Image
                      src={edu.logo}
                      alt={`${edu.institution} logo`}
                      fill
                      sizes="40px"
                      unoptimized={!isOptimizableImage(edu.logo)}
                      className="object-contain p-1.5"
                    />
                  </span>
                ) : (
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-line-700 bg-surface-800 font-mono text-xs tracking-wider text-fg-300"
                  >
                    {initials(edu.institution)}
                  </span>
                )}
                <div className="min-w-0">
                  {period ? <p className="label-mono">{period}</p> : null}
                  <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-fg-50 sm:text-xl">
                    {degree}
                  </h3>
                  <p className="mt-1 text-sm text-fg-300">{edu.institution}</p>
                  {edu.grade ? (
                    <p className="mt-3 label-mono">
                      Grade <span className="ml-2 text-fg-100">{edu.grade}</span>
                    </p>
                  ) : null}
                  {edu.description ? (
                    <p className="mt-3 text-sm leading-relaxed text-fg-300">{edu.description}</p>
                  ) : null}
                </div>
              </div>
            </Reveal>
          </li>
        );
      })}
    </ol>
  );
}
