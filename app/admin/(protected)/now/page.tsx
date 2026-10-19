import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { NowPageForm } from "@/components/admin/now/now-page-form";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Now page" };

export default async function AdminNowPage() {
  const supabase = await createClient();
  const [{ data: now }, { data: projects }] = await Promise.all([
    supabase
      .from("now_page")
      .select("*")
      .order("updated_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("projects")
      .select("id, title, status")
      .is("deleted_at", null)
      .order("title", { ascending: true }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Now page"
        description="What you are building, learning and open to right now. Shown at /now when visible."
      />
      <NowPageForm now={now} projects={projects ?? []} />
    </>
  );
}
