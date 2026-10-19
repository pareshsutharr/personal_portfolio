import type { Metadata } from "next";
import CtaSection from "@/components/portfolio/cta-band";
import { PageHeader } from "@/components/portfolio/page-header";
import { Eyebrow, Section } from "@/components/portfolio/section";
import { EducationTimeline } from "@/components/timeline/education-timeline";
import { ExperienceTimeline } from "@/components/timeline/experience-timeline";
import { VideoGallery } from "@/components/portfolio/video-gallery";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { getEducation, getExperiences, getSocialLinks, getVideos } from "@/lib/queries/public";
import { ButtonLink } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

const DESCRIPTION = "Where I have worked and what I built there.";

export const metadata: Metadata = pageMetadata({
  title: "Experience",
  description: DESCRIPTION,
  path: "/experience",
});

export default async function ExperiencePage() {
  const [experiences, education, videos, socialLinks] = await Promise.all([
    getExperiences(),
    getEducation(),
    getVideos(),
    getSocialLinks(),
  ]);
  const youtube = socialLinks.find((l) => l.platform === "youtube") ?? null;
  const companies = Array.from(new Set(experiences.map((e) => e.company.trim())));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Experience", path: "/experience" },
        ])}
      />
      <PageHeader
        eyebrow="EXPERIENCE"
        title="Work history."
        description={DESCRIPTION}
        aside={
          experiences.length ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 lg:text-right">
              <div>
                <dt className="label-mono">Roles</dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-fg-50 tabular-nums">
                  {String(experiences.length).padStart(2, "0")}
                </dd>
              </div>
              <div>
                <dt className="label-mono">Companies</dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-fg-50 tabular-nums">
                  {String(companies.length).padStart(2, "0")}
                </dd>
              </div>
            </dl>
          ) : null
        }
      />

      <Section className="py-16 sm:py-20 lg:py-28">
        {experiences.length ? (
          <ExperienceTimeline experiences={experiences} />
        ) : (
          <EmptyState title="Experience will be published soon." />
        )}
      </Section>

      {videos.length ? (
        <Section className="border-t border-line-800 py-16 sm:py-20 lg:py-24">
          <div className="mb-10 flex flex-col gap-6 sm:mb-14 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <Eyebrow>Beyond code</Eyebrow>
              <h2 className="mt-5 font-display text-display-sm font-semibold text-fg-50">
                Videos I have made.
              </h2>
              <p className="mt-4 text-base leading-relaxed text-fg-300">
                Teaching series from my YouTube channel and brand videos produced for the companies
                I have worked with.
              </p>
            </div>
            {youtube ? (
              <ButtonLink href={youtube.url} external variant="outline">
                Watch the channel <ArrowUpRight className="h-4 w-4" aria-hidden />
              </ButtonLink>
            ) : null}
          </div>
          <VideoGallery videos={videos} />
        </Section>
      ) : null}

      {education.length ? (
        <Section className="border-t border-line-800 py-16 sm:py-20 lg:py-24">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-4">
              <Eyebrow>Education</Eyebrow>
              <h2 className="mt-5 font-display text-display-sm font-semibold text-fg-50">
                Formal grounding.
              </h2>
            </div>
            <div className="lg:col-span-8">
              <EducationTimeline education={education} />
            </div>
          </div>
        </Section>
      ) : null}

      <CtaSection />
    </>
  );
}
