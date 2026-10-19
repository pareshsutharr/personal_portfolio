import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { ResumeManager } from "@/components/admin/resume/resume-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Resume" };

export default async function ResumePage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("resume_url,updated_at")
    .limit(1)
    .maybeSingle();

  return (
    <div>
      <AdminPageHeader
        title="Resume"
        description="The PDF linked from the public site and served at /resume."
      />
      <ResumeManager resumeUrl={data?.resume_url ?? null} updatedAt={data?.updated_at ?? null} />
    </div>
  );
}
