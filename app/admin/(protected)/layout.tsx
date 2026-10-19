import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/shell";
import { getUnreadCount } from "@/lib/queries/admin";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s — Admin" },
  robots: { index: false, follow: false },
};

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (error || !claims || claims.app_metadata?.role !== "admin") {
    redirect("/admin/login");
  }

  const email = typeof claims.email === "string" ? claims.email : "";
  const unreadCount = await getUnreadCount();

  return (
    <AdminShell user={{ email }} unreadCount={unreadCount}>
      {children}
    </AdminShell>
  );
}
