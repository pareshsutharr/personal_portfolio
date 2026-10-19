import type { Metadata, Route } from "next";
import Link from "next/link";
import CtaSection from "@/components/portfolio/cta-band";
import { PageHeader } from "@/components/portfolio/page-header";
import { Eyebrow, Section, SectionHeader } from "@/components/portfolio/section";
import { TechEcosystem } from "@/components/portfolio/tech-ecosystem";
import { Reveal } from "@/components/motion/reveal";
import { SkillJourney } from "@/components/timeline/skill-journey";
import { EmptyState } from "@/components/ui/empty-state";
import { JsonLd } from "@/components/seo/json-ld";
import { getSkillMilestones, getSkills } from "@/lib/queries/public";
import { breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import { cn } from "@/lib/utils/cn";
import { SKILL_CATEGORY_LABELS, type SkillCategory, type SkillWithProjects } from "@/types";

const DESCRIPTION = "Every technology listed here is tied to the shipped projects that used it.";

export const metadata: Metadata = pageMetadata({
  title: "Skills",
  description: DESCRIPTION,
  path: "/skills",
});

function Proficiency({ level }: { level: number }) {
  return (
    <span className="flex items-center gap-1" aria-label={`Proficiency ${level} of 5`} role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          aria-hidden
          className={cn("h-1.5 w-1.5 rounded-full", i < level ? "bg-ember-500" : "bg-line-600")}
        />
      ))}
    </span>
  );
}

function formatYears(years: number) {
  const n = Number.isInteger(years) ? String(years) : years.toFixed(1);
  return `${n} ${years === 1 ? "yr" : "yrs"}`;
}

function SkillRow({ skill }: { skill: SkillWithProjects }) {
  return (
    <li className="py-4">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <p className="text-base font-medium text-fg-50">{skill.name}</p>
        <div className="flex items-center gap-4">
          {skill.years !== null ? (
            <span className="label-mono tabular-nums">{formatYears(skill.years)}</span>
          ) : null}
          {skill.proficiency !== null ? <Proficiency level={skill.proficiency} /> : null}
        </div>
      </div>
      {skill.description ? (
        <p className="mt-1.5 text-xs leading-relaxed text-fg-500">{skill.description}</p>
      ) : null}
      {skill.projects.length ? (
        <p className="mt-2 text-xs leading-relaxed text-fg-500">
          <span className="mr-2 label-mono text-[0.625rem]">Used across</span>
          {skill.projects.map((p, i) => (
            <span key={p.id}>
              <Link
                href={`/projects/${p.slug}` as Route}
                className="text-fg-300 underline-offset-4 transition-colors hover:text-ember-300 hover:underline"
              >
                {p.title}
              </Link>
              {i < skill.projects.length - 1 ? ", " : ""}
            </span>
          ))}
        </p>
      ) : null}
    </li>
  );
}

export default async function SkillsPage() {
  const [skills, milestones] = await Promise.all([getSkills(), getSkillMilestones()]);
  const groups = (Object.keys(SKILL_CATEGORY_LABELS) as SkillCategory[])
    .map((cat) => ({
      cat,
      label: SKILL_CATEGORY_LABELS[cat],
      items: skills.filter((s) => s.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  let index = 0;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Skills", path: "/skills" },
        ])}
      />
      <PageHeader
        eyebrow="SKILLS"
        title="Technology, in production."
        description={DESCRIPTION}
        aside={
          skills.length ? (
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5 lg:text-right">
              <div>
                <dt className="label-mono">Skills</dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-fg-50 tabular-nums">
                  {String(skills.length).padStart(2, "0")}
                </dd>
              </div>
              <div>
                <dt className="label-mono">Categories</dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-fg-50 tabular-nums">
                  {String(groups.length).padStart(2, "0")}
                </dd>
              </div>
            </dl>
          ) : null
        }
      />

      {skills.length ? (
        <Section className="py-16 sm:py-20 lg:py-28">
          <SectionHeader index={++index} eyebrow="ECOSYSTEM" title="How the stack fits together." />
          <TechEcosystem skills={skills} />
        </Section>
      ) : null}

      {milestones.length ? (
        <Section className="border-t border-line-800 py-16 sm:py-20 lg:py-28">
          <SectionHeader
            index={++index}
            eyebrow="SKILL JOURNEY"
            title="What was learned, and when."
          />
          <SkillJourney milestones={milestones} />
        </Section>
      ) : null}

      <Section className="border-t border-line-800 py-16 sm:py-20 lg:py-28">
        <SectionHeader
          index={++index}
          eyebrow="BY CATEGORY"
          title="Skills, with receipts."
          description="Each entry links to the projects it was used in."
        />
        {groups.length ? (
          <div className="grid gap-x-10 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
            {groups.map((g, i) => (
              <Reveal key={g.cat} delay={(i % 3) * 0.06}>
                <div className="flex items-center justify-between border-b border-line-700 pb-3">
                  <Eyebrow>{g.label}</Eyebrow>
                  <span className="label-mono tabular-nums">
                    {String(g.items.length).padStart(2, "0")}
                  </span>
                </div>
                <ul className="divide-y divide-line-800">
                  {g.items.map((s) => (
                    <SkillRow key={s.id} skill={s} />
                  ))}
                </ul>
              </Reveal>
            ))}
          </div>
        ) : (
          <EmptyState title="Skills will be published soon." />
        )}
      </Section>

      <CtaSection />
    </>
  );
}
