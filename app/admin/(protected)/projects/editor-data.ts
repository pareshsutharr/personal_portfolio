import "server-only";

import type { EditorProject, RelatedOption } from "@/components/admin/projects/editor-types";
import { createClient } from "@/lib/supabase/server";
import type { ClientLogo, Industry, Technology } from "@/types";

type Client = Awaited<ReturnType<typeof createClient>>;

/** Lookups shared by the new + edit editor pages. */
export async function getEditorLookups(
  supabase: Client,
  excludeId?: string,
): Promise<{
  technologies: Technology[];
  industries: Pick<Industry, "id" | "name">[];
  clients: Pick<ClientLogo, "id" | "name">[];
  otherProjects: RelatedOption[];
}> {
  let others = supabase
    .from("projects")
    .select("id,title,slug,status,category")
    .is("deleted_at", null)
    .order("title");
  if (excludeId) others = others.neq("id", excludeId);

  const [techs, inds, clients, projects] = await Promise.all([
    supabase.from("technologies").select("*").order("name"),
    supabase.from("industries").select("id,name").order("display_order"),
    supabase.from("client_logos").select("id,name").order("display_order"),
    others,
  ]);
  return {
    technologies: techs.data ?? [],
    industries: inds.data ?? [],
    clients: clients.data ?? [],
    otherProjects: projects.data ?? [],
  };
}

/** Project row with its pivot ids, features and images; null when missing. */
export async function getProjectForEditor(
  supabase: Client,
  id: string,
): Promise<EditorProject | null> {
  const { data: project } = await supabase.from("projects").select("*").eq("id", id).maybeSingle();
  if (!project) return null;

  const [techs, related, features, images] = await Promise.all([
    supabase.from("project_technologies").select("technology_id").eq("project_id", id),
    supabase.from("related_projects").select("related_project_id").eq("project_id", id),
    supabase.from("project_features").select("*").eq("project_id", id).order("display_order"),
    supabase.from("project_images").select("*").eq("project_id", id).order("display_order"),
  ]);

  return {
    ...project,
    technology_ids: (techs.data ?? []).map((t) => t.technology_id),
    related_project_ids: (related.data ?? []).map((r) => r.related_project_id),
    features: features.data ?? [],
    images: images.data ?? [],
  };
}

export function getSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
}
