import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { MediaLibrary } from "@/components/admin/media/library";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Media Library" };

export default async function MediaPage() {
  const supabase = await createClient();
  const { data, count } = await supabase
    .from("media")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .limit(200);

  return (
    <div>
      <AdminPageHeader
        title="Media Library"
        count={count ?? data?.length ?? 0}
        description="Images and PDFs in Supabase Storage. Drop files anywhere to upload."
      />
      <MediaLibrary initialItems={data ?? []} />
    </div>
  );
}
