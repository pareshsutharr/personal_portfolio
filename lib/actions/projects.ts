"use server";

import { z } from "zod";
import { projectSchema } from "@/lib/validation/schemas";
import { reorderSchema, uuid } from "@/lib/validation/common";
import type { ActionResult, Project, ProjectStatus } from "@/types";
import { dbError, fail, ok, parseInput, requireAdmin, revalidatePublic } from "./helpers";

type AdminClient = Awaited<ReturnType<typeof requireAdmin>>["supabase"];

const statusSchema = z.enum(["draft", "published", "archived"]);
const idsSchema = z.array(uuid).min(1, "Select at least one project.");
const RELATED_LIMIT = 3;

function projectPaths(slug?: string | null) {
  return slug ? ["/projects", `/projects/${slug}`, "/"] : ["/projects", "/"];
}

/**
 * Replaces the project's pivot rows (technologies + related projects) with the
 * given id lists. Returns a friendly error message or null on success.
 */
async function syncRelations(
  supabase: AdminClient,
  projectId: string,
  technologyIds: string[],
  relatedIds: string[],
): Promise<string | null> {
  const { error: clearTech } = await supabase
    .from("project_technologies")
    .delete()
    .eq("project_id", projectId);
  if (clearTech) return dbError(clearTech, "Could not update technologies.");

  const techIds = Array.from(new Set(technologyIds));
  if (techIds.length > 0) {
    const { error } = await supabase
      .from("project_technologies")
      .insert(techIds.map((technology_id) => ({ project_id: projectId, technology_id })));
    if (error) return dbError(error, "Could not update technologies.");
  }

  const { error: clearRelated } = await supabase
    .from("related_projects")
    .delete()
    .eq("project_id", projectId);
  if (clearRelated) return dbError(clearRelated, "Could not update related projects.");

  const relIds = Array.from(new Set(relatedIds))
    .filter((id) => id !== projectId)
    .slice(0, RELATED_LIMIT);
  if (relIds.length > 0) {
    const { error } = await supabase
      .from("related_projects")
      .insert(relIds.map((related_project_id) => ({ project_id: projectId, related_project_id })));
    if (error) return dbError(error, "Could not update related projects.");
  }
  return null;
}

export async function createProject(input: unknown): Promise<ActionResult<Project>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(projectSchema, input);
  if (!parsed.ok) return parsed.result;
  const { technology_ids, related_project_ids, ...row } = parsed.data;

  const { data, error } = await supabase.from("projects").insert(row).select("*").single();
  if (error) return fail(dbError(error, "Could not create project."));

  const syncError = await syncRelations(supabase, data.id, technology_ids, related_project_ids);
  if (syncError) return fail(`Project saved, but linked records failed: ${syncError}`);

  revalidatePublic(projectPaths(data.slug));
  return ok(data, "Project created.");
}

export async function updateProject(id: string, input: unknown): Promise<ActionResult<Project>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(projectSchema, input);
  if (!parsed.ok) return parsed.result;
  const { technology_ids, related_project_ids, ...row } = parsed.data;

  const { data: previous } = await supabase
    .from("projects")
    .select("slug")
    .eq("id", id)
    .maybeSingle();
  const { data, error } = await supabase
    .from("projects")
    .update(row)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not save project."));

  const syncError = await syncRelations(supabase, id, technology_ids, related_project_ids);
  if (syncError) return fail(`Project saved, but linked records failed: ${syncError}`);

  const paths = projectPaths(data.slug);
  if (previous?.slug && previous.slug !== data.slug) paths.push(`/projects/${previous.slug}`);
  revalidatePublic(paths);
  return ok(data, "Project saved.");
}

export async function setProjectStatus(
  id: string,
  status: ProjectStatus,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(statusSchema, status);
  if (!parsed.ok) return parsed.result;
  const { error } = await supabase.from("projects").update({ status: parsed.data }).eq("id", id);
  if (error) return fail(dbError(error, "Could not update status."));
  revalidatePublic(projectPaths());
  const message =
    parsed.data === "published"
      ? "Project published."
      : parsed.data === "archived"
        ? "Project archived."
        : "Project moved to draft.";
  return ok(null, message);
}

export async function toggleProjectFlag(
  id: string,
  field: "featured" | "confidential",
  value: boolean,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const patch = field === "featured" ? { featured: value } : { confidential: value };
  const { error } = await supabase.from("projects").update(patch).eq("id", id);
  if (error) return fail(dbError(error, "Could not update project."));
  revalidatePublic(projectPaths());
  return ok(null);
}

export async function softDeleteProject(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return fail(dbError(error, "Could not move project to trash."));
  revalidatePublic(projectPaths());
  return ok(null, "Moved to trash.");
}

export async function restoreProject(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { error } = await supabase.from("projects").update({ deleted_at: null }).eq("id", id);
  if (error) return fail(dbError(error, "Could not restore project."));
  revalidatePublic(projectPaths());
  return ok(null, "Project restored.");
}

/**
 * Hard delete. Only allowed for projects already in the trash. Pivot rows,
 * features and images cascade; storage objects stay in the media library.
 */
export async function deleteProjectPermanently(id: string): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const { data: row } = await supabase
    .from("projects")
    .select("deleted_at")
    .eq("id", id)
    .maybeSingle();
  if (!row) return fail("Project not found.");
  if (!row.deleted_at) return fail("Move the project to trash before deleting it permanently.");
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return fail(dbError(error, "Could not delete project."));
  revalidatePublic(projectPaths());
  return ok(null, "Project deleted permanently.");
}

export async function duplicateProject(id: string): Promise<ActionResult<Project>> {
  const { supabase } = await requireAdmin();
  const { data: source, error: loadError } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  if (loadError || !source) return fail("Project not found.");

  const copy: Partial<Project> = { ...source };
  delete copy.id;
  delete copy.created_at;
  delete copy.updated_at;
  delete copy.deleted_at;

  const rand = Math.random().toString(36).slice(2, 6);
  const suffix = `-copy-${rand}`;
  const { data, error } = await supabase
    .from("projects")
    .insert({
      ...copy,
      title: `${source.title} (copy)`,
      slug: `${source.slug.slice(0, 80 - suffix.length)}${suffix}`,
      status: "draft",
      featured: false,
    })
    .select("*")
    .single();
  if (error) return fail(dbError(error, "Could not duplicate project."));

  const [techs, related, features, images] = await Promise.all([
    supabase.from("project_technologies").select("technology_id").eq("project_id", id),
    supabase.from("related_projects").select("related_project_id").eq("project_id", id),
    supabase.from("project_features").select("*").eq("project_id", id).order("display_order"),
    supabase.from("project_images").select("*").eq("project_id", id).order("display_order"),
  ]);

  const tasks: PromiseLike<{ error: { message: string; code?: string } | null }>[] = [];
  if (techs.data?.length) {
    tasks.push(
      supabase
        .from("project_technologies")
        .insert(techs.data.map((t) => ({ project_id: data.id, technology_id: t.technology_id }))),
    );
  }
  if (related.data?.length) {
    tasks.push(
      supabase
        .from("related_projects")
        .insert(
          related.data
            .filter((r) => r.related_project_id !== data.id)
            .map((r) => ({ project_id: data.id, related_project_id: r.related_project_id })),
        ),
    );
  }
  if (features.data?.length) {
    tasks.push(
      supabase.from("project_features").insert(
        features.data.map((f) => ({
          project_id: data.id,
          title: f.title,
          description: f.description,
          icon: f.icon,
          display_order: f.display_order,
        })),
      ),
    );
  }
  if (images.data?.length) {
    tasks.push(
      supabase.from("project_images").insert(
        images.data.map((img) => ({
          project_id: data.id,
          image_url: img.image_url,
          alt_text: img.alt_text,
          caption: img.caption,
          type: img.type,
          display_order: img.display_order,
        })),
      ),
    );
  }
  const results = await Promise.all(tasks);
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    return fail(`Duplicated, but some linked records failed: ${dbError(failed.error, "")}`);
  }

  revalidatePublic(projectPaths());
  return ok(data, "Project duplicated.");
}

export async function reorderProjects(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(reorderSchema, { ids });
  if (!parsed.ok) return parsed.result;
  const results = await Promise.all(
    parsed.data.ids.map((id, index) =>
      supabase
        .from("projects")
        .update({ display_order: index + 1 })
        .eq("id", id),
    ),
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return fail(dbError(failed.error, "Could not reorder."));
  revalidatePublic(projectPaths());
  return ok(null, "Order saved.");
}

export async function bulkSetStatus(
  ids: string[],
  status: ProjectStatus,
): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsedIds = parseInput(idsSchema, ids);
  if (!parsedIds.ok) return parsedIds.result;
  const parsedStatus = parseInput(statusSchema, status);
  if (!parsedStatus.ok) return parsedStatus.result;
  const { error } = await supabase
    .from("projects")
    .update({ status: parsedStatus.data })
    .in("id", parsedIds.data);
  if (error) return fail(dbError(error, "Could not update projects."));
  revalidatePublic(projectPaths());
  const n = parsedIds.data.length;
  const verb =
    parsedStatus.data === "published"
      ? "published"
      : parsedStatus.data === "archived"
        ? "archived"
        : "moved to draft";
  return ok(null, `${n} project${n === 1 ? "" : "s"} ${verb}.`);
}

export async function bulkSoftDelete(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(idsSchema, ids);
  if (!parsed.ok) return parsed.result;
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: new Date().toISOString() })
    .in("id", parsed.data);
  if (error) return fail(dbError(error, "Could not move projects to trash."));
  revalidatePublic(projectPaths());
  const n = parsed.data.length;
  return ok(null, `${n} project${n === 1 ? "" : "s"} moved to trash.`);
}

export async function bulkRestore(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(idsSchema, ids);
  if (!parsed.ok) return parsed.result;
  const { error } = await supabase
    .from("projects")
    .update({ deleted_at: null })
    .in("id", parsed.data);
  if (error) return fail(dbError(error, "Could not restore projects."));
  revalidatePublic(projectPaths());
  const n = parsed.data.length;
  return ok(null, `${n} project${n === 1 ? "" : "s"} restored.`);
}

export async function bulkDeletePermanently(ids: string[]): Promise<ActionResult<null>> {
  const { supabase } = await requireAdmin();
  const parsed = parseInput(idsSchema, ids);
  if (!parsed.ok) return parsed.result;
  const { error } = await supabase
    .from("projects")
    .delete()
    .in("id", parsed.data)
    .not("deleted_at", "is", null);
  if (error) return fail(dbError(error, "Could not delete projects."));
  revalidatePublic(projectPaths());
  return ok(null, "Deleted permanently.");
}
