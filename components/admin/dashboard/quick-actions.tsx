import type { Route } from "next";
import Link from "next/link";
import { Award, Briefcase, FileUp, Plus, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";

const ACTIONS: { label: string; description: string; href: Route; icon: LucideIcon }[] = [
  {
    label: "Add project",
    description: "Open the project editor",
    href: "/admin/projects/new" as Route,
    icon: Plus,
  },
  {
    label: "Add certification",
    description: "Issuer, date, credential",
    href: "/admin/certifications?new=1" as Route,
    icon: Award,
  },
  {
    label: "Add experience",
    description: "Role, company, period",
    href: "/admin/experience?new=1" as Route,
    icon: Briefcase,
  },
  {
    label: "Update profile",
    description: "Bio, availability, hero",
    href: "/admin/profile" as Route,
    icon: User,
  },
  {
    label: "Upload resume",
    description: "Replace the public PDF",
    href: "/admin/resume" as Route,
    icon: FileUp,
  },
];

export function QuickActions() {
  return (
    <Panel>
      <PanelHeader title="Quick actions" />
      <ul className="divide-y divide-line-800">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.label}>
              <Link
                href={a.href}
                className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-800/60"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-line-800 bg-surface-800 transition-colors group-hover:border-line-700">
                  <Icon
                    className="h-4 w-4 text-fg-300 transition-colors group-hover:text-ember-400"
                    aria-hidden
                  />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-fg-100">{a.label}</span>
                  <span className="block text-xs text-fg-500">{a.description}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
