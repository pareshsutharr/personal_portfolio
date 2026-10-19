import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ProfileForm } from "@/components/admin/profile/profile-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Profile" };

export default async function AdminProfilePage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <AdminPageHeader
        title="Profile"
        description="Identity, hero copy, photos, availability, bio and résumé. Everything personal lives here."
      />
      <ProfileForm profile={profile} />
    </>
  );
}
