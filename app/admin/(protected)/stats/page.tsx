import type { Metadata } from "next";
import type { ComputedCounts } from "@/components/admin/stats/stat-form";
import { StatsManager } from "@/components/admin/stats/stats-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Stats" };

export default async function AdminStatsPage() {
  const supabase = await createClient();

  // Same filters as lib/queries/public.ts getStats(), so the preview matches the site.
  const [{ data: stats }, projects, technologies, industries] = await Promise.all([
    supabase
      .from("stats")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("visibility", "public")
      .is("deleted_at", null),
    supabase.from("technologies").select("id", { count: "exact", head: true }),
    supabase.from("industries").select("id", { count: "exact", head: true }).eq("is_visible", true),
  ]);

  const computed: ComputedCounts = {
    projects_count: projects.count ?? 0,
    technologies_count: technologies.count ?? 0,
    industries_count: industries.count ?? 0,
  };

  return <StatsManager initialStats={stats ?? []} computed={computed} />;
}
