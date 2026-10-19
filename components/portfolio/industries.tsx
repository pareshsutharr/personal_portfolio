import { Stagger, StaggerItem } from "@/components/motion/reveal";
import type { Industry } from "@/types";
import { DynamicIcon } from "./icon";
import { Section, SectionHeader } from "./section";

type IndustryWithCount = Industry & { computed_count: number };

/** Industries as a 2x4 / 4x2 grid of flat cells. */
export function Industries({
  industries,
  index,
}: {
  industries: IndustryWithCount[];
  index: number;
}) {
  if (!industries.length) return null;
  const list = industries.slice(0, 8);

  return (
    <Section className="bg-bg-900">
      <SectionHeader index={index} eyebrow="Industries" title="Industries I have worked in." />
      <Stagger
        className="grid grid-cols-2 border-t border-l border-line-800 lg:grid-cols-4"
        stagger={0.05}
      >
        {list.map((ind) => (
          <StaggerItem
            key={ind.id}
            className="group flex min-h-[180px] flex-col justify-between border-r border-b border-line-800 p-5 sm:min-h-[200px] sm:p-7"
          >
            <DynamicIcon
              name={ind.icon}
              className="h-5 w-5 text-fg-500 transition-colors group-hover:text-ember-400"
              strokeWidth={1.5}
            />
            <div className="mt-8">
              <h3 className="font-display text-base font-semibold tracking-tight text-fg-50 sm:text-lg">
                {ind.name}
              </h3>
              {ind.description ? (
                <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-fg-300 sm:text-sm">
                  {ind.description}
                </p>
              ) : null}
              {ind.computed_count > 0 ? (
                <p className="mt-4 label-mono">
                  {ind.computed_count} {ind.computed_count === 1 ? "project" : "projects"}
                </p>
              ) : null}
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
