import type { Metadata } from "next";
import { Download, ExternalLink } from "lucide-react";
import CtaSection from "@/components/portfolio/cta-band";
import { PageHeader } from "@/components/portfolio/page-header";
import { MetaRow, Section } from "@/components/portfolio/section";
import { Reveal } from "@/components/motion/reveal";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { getProfile, getSkills } from "@/lib/queries/public";
import { pageMetadata } from "@/lib/seo";

export const metadata: Metadata = pageMetadata({
  title: "Resume",
  description: "Resume of Paresh Suthar, Full Stack Software Engineer.",
  path: "/resume",
});

export default async function ResumePage() {
  const [profile, skills] = await Promise.all([getProfile(), getSkills()]);
  const resume = profile?.resume_url ?? null;
  const featured = skills.filter((s) => s.is_featured).slice(0, 12);
  const name = profile?.full_name ?? "Paresh Suthar";

  if (!resume) {
    return (
      <>
        <PageHeader eyebrow="RESUME" title="Resume will be available soon." />
        <Section className="py-16 sm:py-20">
          <div className="max-w-xl">
            <p className="text-base leading-relaxed text-fg-300">
              The PDF is being updated. In the meantime, the work history and project case studies
              cover the same ground in more detail, and I am happy to send a copy directly.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <ButtonLink href="/experience" variant="outline">
                View experience
              </ButtonLink>
              <ButtonLink href="/contact">Request a copy</ButtonLink>
            </div>
          </div>
        </Section>
        <CtaSection />
      </>
    );
  }

  const isPdf = /\.pdf(\?|#|$)/i.test(resume);
  const fileName = `${name.replace(/\s+/g, "-")}-Resume${isPdf ? ".pdf" : ""}`;

  return (
    <>
      <PageHeader
        eyebrow="RESUME"
        title="Resume"
        description={profile?.professional_title ?? undefined}
        aside={
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <ButtonLink href={resume} external size="lg">
              <ExternalLink className="h-4 w-4" aria-hidden />
              View resume
            </ButtonLink>
            <a
              href={resume}
              download={fileName}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-sm border border-line-600 px-6 text-sm font-medium tracking-wide text-fg-100 transition-colors hover:border-fg-300 hover:bg-surface-800"
            >
              <Download className="h-4 w-4" aria-hidden />
              Download resume
            </a>
          </div>
        }
      />

      <Section className="py-16 sm:py-20 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-4">
            <div className="space-y-10 lg:sticky lg:top-28">
              <MetaRow
                className="grid-cols-1 sm:grid-cols-2 lg:grid-cols-1"
                items={[
                  { label: "NAME", value: name },
                  { label: "TITLE", value: profile?.professional_title },
                  { label: "LOCATION", value: profile?.location },
                  { label: "EXPERIENCE", value: profile?.years_experience },
                ]}
              />
              {featured.length ? (
                <div>
                  <p className="label-mono">Core stack</p>
                  <ul className="mt-4 flex flex-wrap gap-1.5">
                    {featured.map((s) => (
                      <li key={s.id}>
                        <Badge tone="outline">{s.name}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              <p className="text-xs leading-relaxed text-fg-500">
                The embedded preview is shown on larger screens. On mobile, open or download the
                file above.
              </p>
            </div>
          </div>

          <div className="lg:col-span-8">
            <Reveal>
              <div className="hidden aspect-[1/1.3] overflow-hidden rounded-sm border border-line-800 bg-surface-900 lg:block">
                <iframe
                  src={isPdf ? `${resume}#toolbar=0&view=FitH` : resume}
                  title={`${name} resume`}
                  loading="lazy"
                  className="h-full w-full bg-white"
                />
              </div>
              <div className="flex flex-col items-start gap-4 rounded-sm border border-line-800 bg-surface-900 p-6 lg:hidden">
                <p className="label-mono">Preview</p>
                <p className="text-sm leading-relaxed text-fg-300">
                  Open the resume in a new tab to read it on this device.
                </p>
                <ButtonLink href={resume} external variant="outline">
                  Open resume
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </div>
      </Section>

      <CtaSection />
    </>
  );
}
