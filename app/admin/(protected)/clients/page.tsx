import type { Metadata } from "next";
import { ClientManager } from "@/components/admin/clients/client-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Clients" };

export default async function ClientsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("client_logos")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return <ClientManager items={data ?? []} initialOpen={params.new === "1"} />;
}
