import { Plus } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import {
  ProjectsTable,
  type ProjectCounts,
  type ProjectFilters,
  type ProjectRow,
} from "@/components/admin/projects/projects-table";
import { ButtonLink } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

const STATUSES = ["all", "draft", "published", "archived"] as const;

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ProjectsPage({ searchParams }: PageProps<"/admin/projects">) {
  const sp = await searchParams;
  const statusParam = first(sp.status);
  const filters: ProjectFilters = {
    status: STATUSES.includes(statusParam as (typeof STATUSES)[number])
      ? (statusParam as ProjectFilters["status"])
      : "all",
    q: (first(sp.q) ?? "").trim().slice(0, 80),
    featured: first(sp.featured) === "1",
    trash: first(sp.trash) === "1",
  };

  const supabase = await createClient();
  let query = supabase
    .from("projects")
    .select(
      "id,title,slug,category,client,status,visibility,featured,confidential,thumbnail,cover_image,updated_at,deleted_at,display_order,industry:industries(name)",
    )
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (filters.trash) {
    query = query.not("deleted_at", "is", null);
  } else {
    query = query.is("deleted_at", null);
    if (filters.status !== "all") query = query.eq("status", filters.status);
    if (filters.featured) query = query.eq("featured", true);
  }
  if (filters.q) {
    // Commas and parentheses are PostgREST filter syntax; strip them from the term.
    const term = filters.q.replace(/[,()]/g, " ").trim();
    if (term) {
      query = query.or(`title.ilike.%${term}%,category.ilike.%${term}%,client.ilike.%${term}%`);
    }
  }

  const [{ data: rows }, { data: meta }] = await Promise.all([
    query,
    supabase.from("projects").select("status,deleted_at"),
  ]);

  const counts: ProjectCounts = { all: 0, draft: 0, published: 0, archived: 0, trash: 0 };
  for (const m of meta ?? []) {
    if (m.deleted_at) counts.trash += 1;
    else {
      counts.all += 1;
      counts[m.status] += 1;
    }
  }

  return (
    <>
      <AdminPageHeader
        title={filters.trash ? "Projects · Trash" : "Projects"}
        count={filters.trash ? counts.trash : counts.all}
        description={
          filters.trash
            ? "Soft-deleted projects. Restore them or delete permanently."
            : "Case studies shown on the public site. Drafts and private projects stay hidden."
        }
        actions={
          <ButtonLink href="/admin/projects/new" size="sm">
            <Plus className="h-3.5 w-3.5" /> Add project
          </ButtonLink>
        }
      />
      <ProjectsTable rows={(rows ?? []) as ProjectRow[]} counts={counts} filters={filters} />
    </>
  );
}
