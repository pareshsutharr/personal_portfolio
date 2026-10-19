import type { Metadata } from "next";
import { SkillManager } from "@/components/admin/skills/skill-manager";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Skills" };

export default async function SkillsAdminPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const [skills, technologies] = await Promise.all([
    supabase
      .from("skills")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase.from("technologies").select("id, name").order("name", { ascending: true }),
  ]);

  return (
    <SkillManager
      items={skills.data ?? []}
      technologies={technologies.data ?? []}
      initialOpen={params.new === "1"}
    />
  );
}
