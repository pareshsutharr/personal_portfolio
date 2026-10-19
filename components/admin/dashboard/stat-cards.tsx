import type { Route } from "next";
import Link from "next/link";
import {
  Award,
  Briefcase,
  CircleDot,
  FolderKanban,
  Globe,
  Inbox,
  Star,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { StatusDot } from "@/components/ui/badge";
import { AVAILABILITY_LABELS, type AvailabilityStatus } from "@/types";
import type { DashboardStats } from "@/lib/queries/admin";
import { cn } from "@/lib/utils/cn";

type Card = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  href: Route;
  hint?: string;
  accent?: boolean;
};

const AVAILABILITY_TONE: Record<AvailabilityStatus, "success" | "ember" | "amber" | "neutral"> = {
  available: "success",
  selected_projects: "ember",
  open_to_opportunities: "amber",
  not_available: "neutral",
};

export function StatCards({ stats }: { stats: DashboardStats }) {
  const cards: Card[] = [
    {
      label: "Total projects",
      value: stats.projectsTotal,
      icon: FolderKanban,
      href: "/admin/projects" as Route,
    },
    {
      label: "Published",
      value: stats.projectsPublished,
      icon: Globe,
      href: "/admin/projects?status=published" as Route,
    },
    {
      label: "Featured",
      value: stats.projectsFeatured,
      icon: Star,
      href: "/admin/projects?featured=1" as Route,
    },
    {
      label: "Certifications",
      value: stats.certifications,
      icon: Award,
      href: "/admin/certifications" as Route,
    },
    { label: "Skills", value: stats.skills, icon: Wrench, href: "/admin/skills" as Route },
    {
      label: "Experience entries",
      value: stats.experiences,
      icon: Briefcase,
      href: "/admin/experience" as Route,
    },
    {
      label: "Contact leads",
      value: stats.leadsTotal,
      icon: Users,
      href: "/admin/messages" as Route,
    },
    {
      label: "New messages",
      value: stats.newMessages,
      icon: Inbox,
      href: "/admin/messages?status=new" as Route,
      accent: stats.newMessages > 0,
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {cards.map((c) => (
        <StatCard key={c.label} {...c} />
      ))}
      <AvailabilityCard status={stats.availability} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, href, accent }: Card) {
  return (
    <Link href={href} className="group block focus-visible:outline-none">
      <Panel
        className={cn(
          "h-full px-4 py-4 transition-colors group-hover:border-line-700 group-focus-visible:border-ember-500",
          accent && "border-ember-500/30",
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <span className="label-mono">{label}</span>
          <Icon
            className={cn("h-3.5 w-3.5", accent ? "text-ember-400" : "text-fg-700")}
            aria-hidden
          />
        </div>
        <p
          className={cn(
            "mt-3 font-display text-3xl font-semibold tracking-tight tabular-nums",
            accent ? "text-ember-300" : "text-fg-50",
          )}
        >
          {value}
        </p>
      </Panel>
    </Link>
  );
}

function AvailabilityCard({ status }: { status: AvailabilityStatus | null }) {
  return (
    <Link href={"/admin/profile" as Route} className="group block focus-visible:outline-none">
      <Panel className="h-full px-4 py-4 transition-colors group-hover:border-line-700 group-focus-visible:border-ember-500">
        <div className="flex items-center justify-between gap-2">
          <span className="label-mono">Availability</span>
          <CircleDot className="h-3.5 w-3.5 text-fg-700" aria-hidden />
        </div>
        <div className="mt-3 flex items-center gap-2.5">
          <StatusDot
            tone={status ? AVAILABILITY_TONE[status] : "neutral"}
            pulse={status === "available"}
          />
          <p className="font-display text-base leading-tight font-semibold tracking-tight text-fg-50">
            {status ? AVAILABILITY_LABELS[status] : "Not set"}
          </p>
        </div>
        <p className="mt-2 text-xs text-fg-500">
          {status ? "Edit from Profile" : "Set it from Profile"}
        </p>
      </Panel>
    </Link>
  );
}
