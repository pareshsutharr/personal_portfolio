import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SeoForm } from "@/components/admin/settings/seo-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "SEO" };

export default async function AdminSeoPage() {
  const supabase = await createClient();
  const { data: seo } = await supabase
    .from("seo_settings")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";

  return (
    <>
      <AdminPageHeader
        title="SEO"
        description="Titles, descriptions, social cards and the generated sitemap, robots and OG image."
      />
      <SeoForm seo={seo} siteUrl={siteUrl} />
    </>
  );
}
