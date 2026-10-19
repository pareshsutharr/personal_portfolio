import type { Metadata } from "next";
import { ExperienceManager } from "@/components/admin/experience/experience-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Experience" };

export default async function ExperienceAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("experiences")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return <ExperienceManager items={data ?? []} initialOpen={params.new === "1"} />;
}
