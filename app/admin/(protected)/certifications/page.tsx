import type { Metadata } from "next";
import { CertificationManager } from "@/components/admin/certifications/certification-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Certifications" };

export default async function CertificationsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("certifications")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return <CertificationManager items={data ?? []} initialOpen={params.new === "1"} />;
}
