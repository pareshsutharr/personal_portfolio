import { ProjectEditor } from "@/components/admin/projects/project-editor";
import { createClient } from "@/lib/supabase/server";
import { getEditorLookups, getSiteUrl } from "../editor-data";

export const metadata = { title: "New project" };

export default async function NewProjectPage() {
  const supabase = await createClient();
  const lookups = await getEditorLookups(supabase);
  return <ProjectEditor project={null} siteUrl={getSiteUrl()} {...lookups} />;
}
