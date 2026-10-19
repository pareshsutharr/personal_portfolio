import type { Metadata } from "next";
import { CareerMapManager } from "@/components/admin/skill-timeline/career-map-manager";
import { MilestoneManager } from "@/components/admin/skill-timeline/milestone-manager";
import { AdminPageHeader } from "@/components/admin/page-header";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Skill timeline" };

export default async function SkillTimelineAdminPage() {
  const supabase = await createClient();
  const [milestones, steps] = await Promise.all([
    supabase
      .from("skill_milestones")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabase
      .from("career_map_steps")
      .select("*")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  return (
    <>
      <AdminPageHeader
        title="Skill timeline"
        description="How your skills grew over time, and the career map shown alongside it."
      />
      <div className="space-y-6">
        <MilestoneManager items={milestones.data ?? []} />
        <CareerMapManager items={steps.data ?? []} />
      </div>
    </>
  );
}
