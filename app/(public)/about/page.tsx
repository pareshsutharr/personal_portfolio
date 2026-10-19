import type { Metadata } from "next";
import Image from "next/image";
import { ArrowRight, Quote } from "lucide-react";
import { AvailabilityBadge } from "@/components/portfolio/availability-badge";
import CtaSection from "@/components/portfolio/cta-band";
import { Expandable } from "@/components/portfolio/expandable";
import { PageHeader } from "@/components/portfolio/page-header";
import { Eyebrow, Section, SectionHeader } from "@/components/portfolio/section";
import { Reveal } from "@/components/motion/reveal";
import { Prose } from "@/components/projects/prose";
import { EducationTimeline } from "@/components/timeline/education-timeline";
import { JsonLd } from "@/components/seo/json-ld";
import { getCareerMap, getEducation, getProfile, getSocialLinks } from "@/lib/queries/public";
import { breadcrumbJsonLd, pageMetadata, personJsonLd } from "@/lib/seo";
import { initials, isOptimizableImage } from "@/lib/utils/image";

const FALLBACK_TITLE = "Built to ship complete products.";

export async function generateMetadata(): Promise<Metadata> {
  const profile = await getProfile();
  return pageMetadata({
    title: "About",
    description: profile?.short_bio ?? profile?.personal_intro ?? null,
    path: "/about",
    image: profile?.about_photo ?? profile?.profile_photo ?? null,
  });
}

export default async function AboutPage() {
  const [profile, careerMap, education, socialLinks] = await Promise.all([
    getProfile(),
    getCareerMap(),
    getEducation(),
    getSocialLinks(),
  ]);

  const portrait = profile?.about_photo ?? profile?.profile_photo ?? profile?.hero_photo ?? null;
  const name = profile?.full_name ?? "Paresh Suthar";
  const facts = [
    { label: "Location", value: profile?.location },
    { label: "Title", value: profile?.professional_title },
    { label: "Experience", value: profile?.years_experience },
    {
      label: "Email",
      value: profile?.email ? (
        <a
          href={`mailto:${profile.email}`}
          className="break-all transition-colors hover:text-ember-300"
        >
          {profile.email}
        </a>
      ) : null,
    },
  ].filter((f) => Boolean(f.value));

  const blocks = [
    { label: "Career summary", text: profile?.career_summary },
    { label: "Current focus", text: profile?.current_focus },
    { label: "What I build", text: profile?.what_i_build },
    { label: "What I'm looking for", text: profile?.looking_for },
  ].filter((b): b is { label: string; text: string } => Boolean(b.text));

  return (
    <>
      <JsonLd
        data={[
          personJsonLd({
            name,
            title: profile?.professional_title,
            image: portrait,
            email: profile?.email,
            location: profile?.location,
            sameAs: socialLinks.map((s) => s.url),
          }),
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "About", path: "/about" },
          ]),
        ]}
      />
      <PageHeader
        eyebrow="ABOUT"
        title={profile?.personal_intro ?? FALLBACK_TITLE}
        aside={
          profile ? (
            <AvailabilityBadge
              status={profile.availability_status}
              text={profile.availability_text}
            />
          ) : null
        }
      />

      <Section className="py-16 sm:py-20 lg:py-28">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: portrait + facts */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-28">
              <Reveal>
                <div className="grain relative aspect-[4/5] overflow-hidden rounded-sm border border-line-800 bg-surface-900">
                  {portrait ? (
                    <Image
                      src={portrait}
                      alt={name}
                      fill
                      priority
                      sizes="(min-width: 1024px) 40vw, 100vw"
                      unoptimized={!isOptimizableImage(portrait)}
                      className="object-cover"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="absolute inset-0 flex flex-col justify-between grid-lines [background-size:40px_40px] p-6"
                    >
                      <span className="label-mono text-fg-700">Portrait</span>
                      <span className="self-center font-display text-7xl font-semibold tracking-tighter text-fg-700">
                        {initials(name)}
                      </span>
                      <span className="h-px w-10 bg-ember-500" />
                    </div>
                  )}
                </div>
              </Reveal>
              {facts.length ? (
                <dl className="mt-8 divide-y divide-line-800 border-y border-line-800">
                  {facts.map((f) => (
                    <div key={f.label} className="grid grid-cols-[110px_1fr] gap-4 py-3">
                      <dt className="pt-0.5 label-mono">{f.label}</dt>
                      <dd className="text-sm text-fg-100">{f.value}</dd>
                    </div>
                  ))}
                </dl>
              ) : null}
            </div>
          </div>

          {/* Right: bio + blocks */}
          <div className="min-w-0 lg:col-span-7">
            {profile?.short_bio ? (
              <Reveal>
                <p className="font-display text-display-sm font-normal text-balance text-fg-100">
                  {profile.short_bio}
                </p>
              </Reveal>
            ) : null}

            {profile?.long_bio ? (
              <Reveal delay={0.1} className="mt-10">
                <Expandable label="Read the longer story" collapseLabel="Collapse the story">
                  <Prose text={profile.long_bio} />
                </Expandable>
              </Reveal>
            ) : null}

            {profile?.philosophy ? (
              <Reveal className="mt-16 border-t border-line-800 pt-12">
                <Eyebrow>Philosophy</Eyebrow>
                <blockquote className="mt-6 flex gap-5">
                  <Quote className="mt-1 h-6 w-6 shrink-0 text-ember-500" aria-hidden />
                  <p className="font-display text-2xl font-medium tracking-tight text-balance text-fg-50 sm:text-3xl">
                    {profile.philosophy}
                  </p>
                </blockquote>
              </Reveal>
            ) : null}

            {blocks.length ? (
              <div className="mt-16 border-t border-line-800">
                {blocks.map((b, i) => (
                  <Reveal
                    key={b.label}
                    delay={i * 0.05}
                    className="grid gap-4 border-b border-line-800 py-10 sm:grid-cols-[180px_1fr] sm:gap-8"
                  >
                    <Eyebrow>{b.label}</Eyebrow>
                    <Prose text={b.text} />
                  </Reveal>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </Section>

      {careerMap.length ? (
        <Section className="border-t border-line-800 py-16 sm:py-20 lg:py-24">
          <SectionHeader eyebrow="CAREER MAP" title="How my work has changed." />
          <ol className="flex flex-wrap items-stretch gap-y-6">
            {careerMap.map((step, i) => (
              <li key={step.id} className="flex items-stretch">
                <Reveal
                  delay={i * 0.05}
                  className="flex max-w-xs flex-col rounded-sm border border-line-700 bg-surface-900 px-5 py-4"
                >
                  <span className="label-mono text-ember-400">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="mt-2 font-display text-lg font-semibold tracking-tight text-fg-50">
                    {step.label}
                  </span>
                  {step.description ? (
                    <span className="mt-1.5 text-sm leading-relaxed text-fg-300">
                      {step.description}
                    </span>
                  ) : null}
                </Reveal>
                {i < careerMap.length - 1 ? (
                  <span
                    aria-hidden
                    className="flex items-center px-3 label-mono text-fg-500 sm:px-4"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </span>
                ) : null}
              </li>
            ))}
          </ol>
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
