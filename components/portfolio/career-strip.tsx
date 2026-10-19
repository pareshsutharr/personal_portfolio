import { ArrowRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Reveal, Stagger, StaggerItem } from "@/components/motion/reveal";
import { formatPeriod } from "@/lib/utils/format";
import type { CareerMapStep, Experience } from "@/types";
import { ROUTES } from "./routes";
import { Section, SectionHeader } from "./section";

function chronological(list: Experience[]) {
  const dated = list.every((e) => Boolean(e.start_date));
  if (!dated) return list;
  return [...list].sort(
    (a, b) =>
      new Date(a.start_date as string).getTime() - new Date(b.start_date as string).getTime(),
  );
}

/** Horizontal career progression + career map chain. Preview only; /experience owns the full timeline. */
export function CareerStrip({
  experiences,
  careerMap,
  index,
}: {
  experiences: Experience[];
  careerMap: CareerMapStep[];
  index: number;
}) {
  if (!experiences.length && !careerMap.length) return null;
  const steps = chronological(experiences);

  return (
    <Section className="bg-bg-950" bleed>
      <div className="container-x">
        <SectionHeader
          index={index}
          eyebrow="Career timeline"
          title="Where I have worked."
          action={
            <ButtonLink href={ROUTES.experience} variant="outline">
              Full experience
            </ButtonLink>
          }
        />
      </div>

      {steps.length ? (
        <div className="relative">
          <div className="no-scrollbar overflow-x-auto">
            <Stagger className="container-x" stagger={0.1}>
              <ol className="relative flex min-w-max gap-0 pt-6 pb-2">
                {/* connecting line */}
                <span
                  aria-hidden
                  className="absolute top-[calc(1.5rem+5px)] right-0 left-0 h-px bg-line-700"
                />
                {steps.map((e, i) => {
                  const period = formatPeriod({
                    periodLabel: e.period_label,
                    startDate: e.start_date,
                    endDate: e.end_date,
                    isCurrent: e.is_current,
                  });
                  const last = i === steps.length - 1;
                  return (
                    <StaggerItem
                      key={e.id}
                      as="li"
                      className="relative w-[240px] shrink-0 pr-8 sm:w-[280px] lg:w-auto lg:min-w-[220px] lg:flex-1"
                    >
                      <span
                        aria-hidden
                        className={
                          last && e.is_current
                            ? "relative block h-[11px] w-[11px] rounded-full bg-ember-500 ring-4 ring-ember-500/25"
                            : "relative block h-[11px] w-[11px] rounded-full border-2 border-ember-500 bg-bg-950"
                        }
                      />
                      <div className="mt-6">
                        {period ? <p className="label-mono">{period}</p> : null}
                        <h3 className="mt-3 font-display text-lg font-semibold tracking-tight text-fg-50">
                          {e.position}
                        </h3>
                        <p className="mt-1 text-sm text-fg-300">{e.company}</p>
                      </div>
                    </StaggerItem>
                  );
                })}
              </ol>
            </Stagger>
          </div>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-bg-950 to-transparent lg:hidden"
          />
        </div>
      ) : null}

      {careerMap.length ? (
        <div className="container-x">
          <Reveal className={steps.length ? "mt-14 border-t border-line-800 pt-8" : ""}>
            <p className="mb-5 label-mono">Career map</p>
            <ol className="flex flex-wrap items-center gap-x-3 gap-y-3">
              {careerMap.map((step, i) => (
                <li key={step.id} className="flex items-center gap-3">
                  <span
                    className="font-mono text-xs tracking-[0.14em] text-fg-100 uppercase"
                    title={step.description ?? undefined}
                  >
                    {step.label}
                  </span>
                  {i < careerMap.length - 1 ? (
                    <ArrowRight className="h-3 w-3 text-ember-500" aria-hidden />
                  ) : null}
                </li>
              ))}
            </ol>
          </Reveal>
        </div>
      ) : null}
    </Section>
  );
}
