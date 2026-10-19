import { TechnologiesAdmin } from "@/components/admin/technologies/technologies-table";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Technologies" };

export default async function TechnologiesPage() {
  const supabase = await createClient();
  const [{ data: technologies }, { data: links }] = await Promise.all([
    supabase.from("technologies").select("*").order("category").order("name"),
    supabase.from("project_technologies").select("technology_id"),
  ]);

  const usage: Record<string, number> = {};
  for (const l of links ?? []) usage[l.technology_id] = (usage[l.technology_id] ?? 0) + 1;

  return <TechnologiesAdmin technologies={technologies ?? []} usage={usage} />;
}
