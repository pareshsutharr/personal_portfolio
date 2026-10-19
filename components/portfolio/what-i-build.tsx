import { ServiceEnquiry } from "@/components/contact/service-enquiry";
import { ButtonLink } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { padIndex } from "@/lib/utils/format";
import type { Service } from "@/types";
import { DynamicIcon } from "./icon";
import { ROUTES } from "./routes";
import { Section, SectionHeader } from "./section";

/** Services as a grid of flat, hairline-separated rows. */
export function WhatIBuild({
  services,
  intro,
  index,
}: {
  services: Service[];
  intro?: string | null;
  index: number;
}) {
  if (!services.length) return null;
  const list = [...services]
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.display_order - b.display_order)
    .slice(0, 6);

  return (
    <Section className="bg-bg-950">
      <SectionHeader
        index={index}
        eyebrow="What I build"
        title="What I take on."
        description={intro ?? undefined}
        action={
          <ButtonLink href={ROUTES.services} variant="outline" size="md">
            All services
          </ButtonLink>
        }
      />
      <Stagger className="grid border-t border-l border-line-800 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s, i) => (
          <StaggerItem
            key={s.id}
            className="group relative flex min-h-[220px] flex-col justify-between border-r border-b border-line-800 p-6 sm:p-8"
          >
            <div className="flex items-start justify-between">
              <span className="label-mono text-ember-400">{padIndex(i + 1)}</span>
              <DynamicIcon
                name={s.icon}
                className="h-5 w-5 text-fg-500 transition-colors group-hover:text-fg-100"
                strokeWidth={1.5}
              />
            </div>
            <div className="mt-10">
              <h3 className="font-display text-xl font-semibold tracking-tight text-fg-50">
                {s.title}
              </h3>
              {s.description ? (
                <p className="mt-3 text-sm leading-relaxed text-fg-300">{s.description}</p>
              ) : null}
              <div className="mt-5">
                <ServiceEnquiry
                  title={s.title}
                  slug={s.slug}
                  variant="ghost"
                  label="Request"
                  className="-ml-3"
                />
              </div>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </Section>
  );
}
