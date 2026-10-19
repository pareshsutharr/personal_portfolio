import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SiteSettingsForm } from "@/components/admin/settings/site-settings-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Site settings" };

export default async function AdminSettingsPage() {
  const supabase = await createClient();
  const { data: settings } = await supabase
    .from("site_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // Only a boolean crosses to the client; the key itself never leaves the server.
  const emailConfigured = Boolean(process.env.RESEND_API_KEY);

  return (
    <>
      <AdminPageHeader
        title="Site settings"
        description="Brand, contact details, footer, CTA, analytics and notifications."
      />
      <SiteSettingsForm settings={settings} emailConfigured={emailConfigured} />
    </>
  );
}
