import type { Metadata } from "next";
import { PageHeader } from "@/components/portfolio/page-header";
import { Section } from "@/components/portfolio/section";
import CtaSection from "@/components/portfolio/cta-band";
import { ProjectFilters } from "@/components/projects/project-filters";
import { MobileCta } from "@/components/contact/mobile-cta";
import { JsonLd } from "@/components/seo/json-ld";
import { getProjects } from "@/lib/queries/public";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";

const DESCRIPTION =
  "Production work documented as case studies: the problem, the architecture, the decisions and what shipped.";

export const metadata: Metadata = pageMetadata({
  title: "Projects",
  description: DESCRIPTION,
  path: "/projects",
});

export default async function ProjectsPage() {
  const projects = await getProjects();
  const industries = Array.from(
    new Set(projects.map((p) => p.industry?.name).filter((n): n is string => Boolean(n))),
  );

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Projects",
    itemListElement: projects.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.title,
      url: absoluteUrl(`/projects/${p.slug}`),
    })),
  };

  return (
    <>
      <JsonLd
        data={[
          itemList,
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Work", path: "/projects" },
          ]),
        ]}
      />
      <PageHeader
        eyebrow="SELECTED WORK"
        title="Projects"
        description={DESCRIPTION}
        aside={
          <dl className="grid grid-cols-2 gap-x-8 gap-y-5 lg:text-right">
            <div>
              <dt className="label-mono">Case studies</dt>
              <dd className="mt-2 font-display text-3xl font-semibold text-fg-50 tabular-nums">
                {String(projects.length).padStart(2, "0")}
              </dd>
            </div>
            {industries.length ? (
              <div>
                <dt className="label-mono">Industries</dt>
                <dd className="mt-2 font-display text-3xl font-semibold text-fg-50 tabular-nums">
                  {String(industries.length).padStart(2, "0")}
                </dd>
              </div>
            ) : null}
          </dl>
        }
      />
      <Section className="py-10 sm:py-14 lg:py-16">
        <ProjectFilters projects={projects} />
      </Section>
      <CtaSection />
      <MobileCta />
    </>
  );
}
