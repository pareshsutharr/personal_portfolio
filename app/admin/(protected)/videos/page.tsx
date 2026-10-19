import type { Metadata } from "next";
import { VideoManager } from "@/components/admin/videos/video-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Videos" };

export default async function VideosAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const [{ data: videos }, { data: experiences }] = await Promise.all([
    supabase
      .from("videos")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("experiences").select("id,company,position").order("display_order"),
  ]);

  return (
    <VideoManager
      items={videos ?? []}
      experiences={experiences ?? []}
      initialOpen={params.new === "1"}
    />
  );
}
