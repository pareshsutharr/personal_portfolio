import { ArrowUpRight, GraduationCap } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import type { Certification, Education } from "@/types";
import { ROUTES } from "./routes";
import { Eyebrow, Section } from "./section";

/**
 * Education and certifications side by side in one short section, so the
 * landing page covers both without two separate scroll stops.
 */
export function CredentialsPreview({
  education,
  certifications,
  index,
}: {
  education: Education[];
  certifications: Certification[];
  index: number;
}) {
  const certs = certifications.slice(0, 6);
  if (!education.length && !certs.length) return null;

  return (
    <Section className="bg-bg-950">
      <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
        {education.length ? (
          <div className="lg:col-span-5">
            <Eyebrow index={index}>Education</Eyebrow>
            <Stagger className="mt-6 flex flex-col">
              {education.map((e) => (
                <StaggerItem
                  key={e.id}
                  className="flex gap-4 border-t border-line-800 py-5 first:border-t-0 first:pt-0"
                >
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-line-700 text-fg-300">
                    <GraduationCap className="h-4 w-4" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <p className="font-display text-lg font-semibold tracking-tight text-fg-50">
                      {e.degree}
                      {e.field ? <span className="text-fg-300"> · {e.field}</span> : null}
                    </p>
                    <p className="mt-1 text-sm text-fg-300">{e.institution}</p>
                    <p className="mt-2 flex flex-wrap gap-x-4 label-mono">
                      {e.period_label ? <span>{e.period_label}</span> : null}
                      {e.grade ? <span className="text-ember-400">{e.grade}</span> : null}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        ) : null}

        {certs.length ? (
          <div className={education.length ? "lg:col-span-6 lg:col-start-7" : "lg:col-span-8"}>
            <div className="flex items-end justify-between gap-4">
              <Eyebrow>Certifications</Eyebrow>
              <ButtonLink href={ROUTES.certifications} variant="ghost" size="sm">
                All {certifications.length}
                <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
              </ButtonLink>
            </div>
            <Stagger className="mt-6 flex flex-col" stagger={0.05}>
              {certs.map((c) => (
                <StaggerItem
                  key={c.id}
                  className="flex flex-col gap-1 border-t border-line-800 py-3.5 first:border-t-0 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
                >
                  <span className="min-w-0 text-sm text-fg-100 sm:truncate sm:text-[0.9375rem]">
                    {c.title}
                  </span>
                  <span className="shrink-0 label-mono">{c.issuer}</span>
                </StaggerItem>
              ))}
            </Stagger>
          </div>
        ) : null}
      </div>
    </Section>
  );
}
