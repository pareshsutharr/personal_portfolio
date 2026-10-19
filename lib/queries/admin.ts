import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import type { AvailabilityStatus, ContactMessage, Project } from "@/types";

/**
 * Admin read layer. Uses the cookie-bound server client so RLS applies as the
 * signed-in admin. Only server components / server actions may import this.
 */

export type DashboardStats = {
  projectsTotal: number;
  projectsPublished: number;
  projectsFeatured: number;
  certifications: number;
  skills: number;
  experiences: number;
  leadsTotal: number;
  newMessages: number;
  availability: AvailabilityStatus | null;
};

export type RecentMessage = Pick<
  ContactMessage,
  "id" | "name" | "email" | "company" | "project_type" | "status" | "created_at"
>;

export type RecentProject = Pick<
  Project,
  "id" | "title" | "slug" | "status" | "featured" | "updated_at" | "thumbnail"
>;

export type DashboardData = {
  stats: DashboardStats;
  recentMessages: RecentMessage[];
  recentProjects: RecentProject[];
};

export const getUnreadCount = cache(async (): Promise<number> => {
  const supabase = await createClient();
  const { count } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "new");
  return count ?? 0;
});

export const getDashboardData = cache(async (): Promise<DashboardData> => {
  const supabase = await createClient();

  const count = (q: PromiseLike<{ count: number | null }>) => q.then((r) => r.count ?? 0);

  const [
    projectsTotal,
    projectsPublished,
    projectsFeatured,
    certifications,
    skills,
    experiences,
    leadsTotal,
    newMessages,
    profileRes,
    messagesRes,
    projectsRes,
  ] = await Promise.all([
    count(
      supabase.from("projects").select("id", { count: "exact", head: true }).is("deleted_at", null),
    ),
    count(
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("status", "published"),
    ),
    count(
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .is("deleted_at", null)
        .eq("featured", true),
    ),
    count(supabase.from("certifications").select("id", { count: "exact", head: true })),
    count(supabase.from("skills").select("id", { count: "exact", head: true })),
    count(supabase.from("experiences").select("id", { count: "exact", head: true })),
    count(supabase.from("contact_messages").select("id", { count: "exact", head: true })),
    count(
      supabase
        .from("contact_messages")
        .select("id", { count: "exact", head: true })
        .eq("status", "new"),
    ),
    supabase.from("profiles").select("availability_status").limit(1).maybeSingle(),
    supabase
      .from("contact_messages")
      .select("id,name,email,company,project_type,status,created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("projects")
      .select("id,title,slug,status,featured,updated_at,thumbnail")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
      .limit(5),
  ]);

  return {
    stats: {
      projectsTotal,
      projectsPublished,
      projectsFeatured,
      certifications,
      skills,
      experiences,
      leadsTotal,
      newMessages,
      availability: profileRes.data?.availability_status ?? null,
    },
    recentMessages: messagesRes.data ?? [],
    recentProjects: projectsRes.data ?? [],
  };
});
