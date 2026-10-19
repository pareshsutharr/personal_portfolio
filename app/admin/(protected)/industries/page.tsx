import { IndustriesAdmin } from "@/components/admin/industries/industries-list";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Industries" };

export default async function IndustriesPage() {
  const supabase = await createClient();
  const [{ data: industries }, { data: projects }] = await Promise.all([
    supabase.from("industries").select("*").order("display_order").order("name"),
    supabase.from("projects").select("industry_id").is("deleted_at", null),
  ]);

  const counts: Record<string, number> = {};
  for (const p of projects ?? []) {
    if (p.industry_id) counts[p.industry_id] = (counts[p.industry_id] ?? 0) + 1;
  }

  return <IndustriesAdmin industries={industries ?? []} counts={counts} />;
}
