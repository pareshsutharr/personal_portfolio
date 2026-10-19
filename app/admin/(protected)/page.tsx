import type { Metadata } from "next";
import { AdminPageHeader } from "@/components/admin/page-header";
import { StatCards } from "@/components/admin/dashboard/stat-cards";
import { RecentMessages } from "@/components/admin/dashboard/recent-messages";
import { RecentProjects } from "@/components/admin/dashboard/recent-projects";
import { QuickActions } from "@/components/admin/dashboard/quick-actions";
import { getDashboardData } from "@/lib/queries/admin";

export const metadata: Metadata = { title: "Dashboard" };

export default async function AdminDashboardPage() {
  const { stats, recentMessages, recentProjects } = await getDashboardData();

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of content, media and incoming leads."
      />
      <StatCards stats={stats} />
      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <div className="space-y-6 xl:col-span-2">
          <RecentMessages messages={recentMessages} />
          <RecentProjects projects={recentProjects} />
        </div>
        <QuickActions />
      </div>
    </div>
  );
}
