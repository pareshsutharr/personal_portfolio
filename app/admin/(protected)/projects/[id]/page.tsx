import { notFound } from "next/navigation";
import { ProjectEditor } from "@/components/admin/projects/project-editor";
import { createClient } from "@/lib/supabase/server";
import { getEditorLookups, getProjectForEditor, getSiteUrl } from "../editor-data";

export default async function EditProjectPage({ params }: PageProps<"/admin/projects/[id]">) {
  const { id } = await params;
  const supabase = await createClient();
  const [project, lookups] = await Promise.all([
    getProjectForEditor(supabase, id),
    getEditorLookups(supabase, id),
  ]);
  if (!project) notFound();

  return <ProjectEditor key={project.id} project={project} siteUrl={getSiteUrl()} {...lookups} />;
}
