import type { Metadata } from "next";
import { EducationManager } from "@/components/admin/education/education-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Education" };

export default async function EducationAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("education")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return <EducationManager items={data ?? []} initialOpen={params.new === "1"} />;
}
