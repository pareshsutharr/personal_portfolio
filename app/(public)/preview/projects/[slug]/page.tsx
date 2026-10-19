import type { Metadata, Route } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Eye } from "lucide-react";
import { ProjectCaseStudy } from "@/components/projects/case-study";
import { createClient } from "@/lib/supabase/server";
import type { ProjectWithRelations, Technology } from "@/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Preview",
  robots: { index: false, follow: false },
};

const PREVIEW_SELECT = `
  *,
  industry:industries ( id, name, slug ),
  client_logo:client_logos ( id, name, logo_url, url ),
  project_technologies ( technology:technologies ( * ) ),
  features:project_features ( * ),
  images:project_images ( * )
`;

type RawPreview = Omit<ProjectWithRelations, "technologies" | "related"> & {
  project_technologies: { technology: Technology | null }[];
};

/**
 * Admin-only preview of a project in any status, rendered through the public
 * case-study component. Lives under the public layout on purpose so the nav
 * and footer match what visitors will see.
 */
export default async function PreviewProjectPage({
  params,
}: PageProps<"/preview/projects/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  if (claims?.claims?.app_metadata?.role !== "admin") {
    redirect(`/admin/login?next=${encodeURIComponent(`/preview/projects/${slug}`)}`);
  }

  const { data } = await supabase
    .from("projects")
    .select(PREVIEW_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .maybeSingle();
  if (!data) notFound();

  const raw = data as unknown as RawPreview;
  const { project_technologies, features, images, ...rest } = raw;
  const project: ProjectWithRelations = {
    ...rest,
    technologies: project_technologies
      .map((pt) => pt.technology)
      .filter((t): t is Technology => Boolean(t))
      .sort((a, b) => a.name.localeCompare(b.name)),
    features: [...(features ?? [])].sort((a, b) => a.display_order - b.display_order),
    images: [...(images ?? [])].sort((a, b) => a.display_order - b.display_order),
    related: [],
  };

  const flags = [
    project.status.toUpperCase(),
    project.visibility !== "public" ? project.visibility.toUpperCase() : null,
    project.confidential ? `CONFIDENTIAL · ${project.confidential_mode.toUpperCase()}` : null,
  ].filter(Boolean);

  return (
    <>
      <div className="sticky top-16 z-40 bg-amber-400 text-bg-950 lg:top-20">
        <div className="container-x flex min-h-11 flex-wrap items-center justify-between gap-x-6 gap-y-2 py-2">
          <p className="flex items-center gap-3 font-mono text-[11px] font-medium tracking-[0.14em] uppercase">
            <Eye className="h-3.5 w-3.5" aria-hidden />
            Preview — {flags.join(" / ")}
          </p>
          <Link
            href={`/admin/projects/${project.id}` as Route}
            className="inline-flex min-h-9 items-center gap-2 font-mono text-[11px] font-medium tracking-[0.14em] uppercase underline-offset-4 hover:underline"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
            Back to editor
          </Link>
        </div>
      </div>
      <ProjectCaseStudy project={project} preview />
    </>
  );
}
