import type { Metadata, Route } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight } from "lucide-react";
import CtaSection from "@/components/portfolio/cta-band";
import { Eyebrow } from "@/components/portfolio/section";
import { ProjectCaseStudy } from "@/components/projects/case-study";
import { isSummaryConfidential } from "@/components/projects/project-card";
import { MobileCta } from "@/components/contact/mobile-cta";
import { getProjectBySlug, getProjectSlugs, getProjects } from "@/lib/queries/public";
import { pageMetadata } from "@/lib/seo";
import { initials, isOptimizableImage } from "@/lib/utils/image";
import type { ProjectWithRelations } from "@/types";

export async function generateStaticParams() {
  const slugs = await getProjectSlugs();
  return slugs.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/projects/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);
  if (!project) return { title: "Project not found", robots: { index: false } };
  const summary = isSummaryConfidential(project);
  return pageMetadata({
    title: project.meta_title ?? project.title,
    description: project.meta_description ?? project.short_description,
    path: project.canonical_url ?? `/projects/${project.slug}`,
    image: summary ? null : (project.og_image ?? project.cover_image),
    type: "article",
    noIndex: project.visibility === "unlisted",
  });
}

function RelatedProjects({ related }: { related: ProjectWithRelations["related"] }) {
  if (!related.length) return null;
  return (
    <section aria-labelledby="related-title" className="border-t border-line-800">
      <div className="container-x py-16 sm:py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <Eyebrow>More work</Eyebrow>
            <h2
              id="related-title"
              className="mt-4 font-display text-display-sm font-semibold text-fg-50"
            >
              Related projects
            </h2>
          </div>
          <Link
            href="/projects"
            className="hidden min-h-11 items-center gap-2 label-mono transition-colors hover:text-fg-100 sm:inline-flex"
          >
            All projects
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
        <ul className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {related.slice(0, 3).map((r) => {
            const img = r.thumbnail ?? r.cover_image;
            return (
              <li key={r.id}>
                <Link
                  href={`/projects/${r.slug}` as Route}
                  data-cursor="view"
                  className="group block"
                >
                  <div className="relative aspect-[16/10] overflow-hidden rounded-sm border border-line-800 bg-surface-900">
                    {img ? (
                      <Image
                        src={img}
                        alt={r.title}
                        fill
                        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
                        unoptimized={!isOptimizableImage(img)}
                        className="object-cover transition-transform duration-700 ease-out-expo group-hover:scale-[1.03] motion-reduce:transition-none"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className="absolute inset-0 flex items-center justify-center grid-lines [background-size:40px_40px]"
                      >
                        <span className="font-display text-4xl font-semibold tracking-tighter text-fg-700">
                          {initials(r.title)}
                        </span>
                      </div>
                    )}
                  </div>
                  {r.category ? <p className="mt-4 label-mono">{r.category}</p> : null}
                  <h3 className="mt-2 font-display text-lg font-semibold tracking-tight text-fg-50 transition-colors group-hover:text-ember-300">
                    {r.title}
                  </h3>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function PrevNext({
  prev,
  next,
}: {
  prev: ProjectWithRelations | null;
  next: ProjectWithRelations | null;
}) {
  if (!prev && !next) return null;
  return (
    <nav aria-label="Project navigation" className="border-t border-line-800">
      <div className="container-x">
        <div className="grid divide-y divide-line-800 sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          <div className="py-8 sm:pr-10">
            {prev ? (
              <Link href={`/projects/${prev.slug}` as Route} className="group block min-h-11">
                <span className="inline-flex items-center gap-2 label-mono transition-colors group-hover:text-fg-100">
                  <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
                  Previous
                </span>
                <span className="mt-3 block font-display text-xl font-semibold tracking-tight text-fg-50 transition-colors group-hover:text-ember-300 sm:text-2xl">
                  {prev.title}
                </span>
              </Link>
            ) : null}
          </div>
          <div className="py-8 sm:pl-10 sm:text-right">
            {next ? (
              <Link href={`/projects/${next.slug}` as Route} className="group block min-h-11">
                <span className="inline-flex items-center gap-2 label-mono transition-colors group-hover:text-fg-100">
                  Next
                  <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </span>
                <span className="mt-3 block font-display text-xl font-semibold tracking-tight text-fg-50 transition-colors group-hover:text-ember-300 sm:text-2xl">
                  {next.title}
                </span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default async function ProjectPage({ params }: PageProps<"/projects/[slug]">) {
  const { slug } = await params;
  const [project, all] = await Promise.all([getProjectBySlug(slug), getProjects()]);
  if (!project) notFound();

  const index = all.findIndex((p) => p.id === project.id);
  const prev = index > 0 ? all[index - 1] : null;
  const next = index >= 0 && index < all.length - 1 ? all[index + 1] : null;

  return (
    <>
      <ProjectCaseStudy project={project} />
      <PrevNext prev={prev} next={next} />
      <RelatedProjects related={project.related.filter((r) => r.id !== project.id)} />
      <CtaSection />
      <MobileCta label="Discuss a project like this" />
    </>
  );
}
