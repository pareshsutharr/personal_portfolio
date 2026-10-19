import type { Metadata } from "next";
import { SocialLinksManager } from "@/components/admin/social-links/social-links-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Social links" };

export default async function AdminSocialLinksPage() {
  const supabase = await createClient();
  const { data: links } = await supabase
    .from("social_links")
    .select("*")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  return <SocialLinksManager initialLinks={links ?? []} />;
}
