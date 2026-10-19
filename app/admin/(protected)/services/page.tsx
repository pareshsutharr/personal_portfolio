import type { Metadata } from "next";
import { ServiceManager } from "@/components/admin/services/service-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Services" };

export default async function ServicesAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return <ServiceManager items={data ?? []} initialOpen={params.new === "1"} />;
}
