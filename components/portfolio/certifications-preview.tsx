import { ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { Stagger, StaggerItem } from "@/components/motion/reveal";
import { padIndex, yearOf } from "@/lib/utils/format";
import type { Certification } from "@/types";
import { ROUTES } from "./routes";
import { Section, SectionHeader } from "./section";

/** Simple row list of certifications (max 5). */
export function CertificationsPreview({
  certifications,
  index,
}: {
  certifications: Certification[];
  index: number;
}) {
  if (!certifications.length) return null;
  const list = certifications.slice(0, 5);

  return (
    <Section className="bg-bg-900">
      <SectionHeader
        index={index}
        eyebrow="Certifications"
        title="Credentials."
        action={
          <ButtonLink href={ROUTES.certifications} variant="outline">
            All certifications
          </ButtonLink>
        }
      />
      <Stagger className="border-t border-line-800">
        {list.map((c, i) => {
          const year = yearOf(c.issue_date);
          const inner = (
            <>
              <span className="w-8 shrink-0 label-mono text-ember-400">{padIndex(i + 1)}</span>
              <span className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
                <span className="font-medium text-fg-50">{c.title}</span>
                {c.issuer ? <span className="text-sm text-fg-300">{c.issuer}</span> : null}
              </span>
              <span className="flex shrink-0 items-center gap-4">
                {year ? <span className="label-mono">{year}</span> : null}
                {c.credential_url ? (
                  <ArrowUpRight className="h-4 w-4 text-fg-500" aria-hidden />
                ) : null}
              </span>
            </>
          );
          return (
            <StaggerItem key={c.id} className="border-b border-line-800">
              {c.credential_url ? (
                <a
                  href={c.credential_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-14 items-center gap-4 py-4 transition-colors hover:bg-surface-900 sm:gap-6"
                >
                  {inner}
                  <span className="sr-only">(opens credential in a new tab)</span>
                </a>
              ) : (
                <div className="flex min-h-14 items-center gap-4 py-4 sm:gap-6">{inner}</div>
              )}
            </StaggerItem>
          );
        })}
      </Stagger>
    </Section>
  );
}
