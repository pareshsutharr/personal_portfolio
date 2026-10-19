import type { Route } from "next";
import type { LucideIcon } from "lucide-react";
import {
  Award,
  Briefcase,
  Building2,
  Clapperboard,
  ChartColumn,
  ChartLine,
  Clock,
  Cpu,
  FileText,
  FolderKanban,
  GitBranch,
  Globe,
  GraduationCap,
  Handshake,
  Images,
  Inbox,
  Layers,
  LayoutDashboard,
  Link2,
  Settings,
  User,
  Wrench,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: Route;
  icon: LucideIcon;
  /** Show the unread message count next to this item. */
  badge?: "unread";
};

export type NavGroup = {
  label: string | null;
  items: NavItem[];
};

/**
 * Single source of truth for admin navigation. Used by the sidebar, the
 * mobile drawer, the top-bar title and the command palette.
 * Hrefs are cast because typed routes only know pages that already exist.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    label: null,
    items: [{ label: "Dashboard", href: "/admin" as Route, icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { label: "Profile", href: "/admin/profile" as Route, icon: User },
      { label: "Projects", href: "/admin/projects" as Route, icon: FolderKanban },
      { label: "Experience", href: "/admin/experience" as Route, icon: Briefcase },
      { label: "Education", href: "/admin/education" as Route, icon: GraduationCap },
      { label: "Skills", href: "/admin/skills" as Route, icon: Wrench },
      { label: "Skill Timeline", href: "/admin/skill-timeline" as Route, icon: GitBranch },
      { label: "Certifications", href: "/admin/certifications" as Route, icon: Award },
      { label: "Services", href: "/admin/services" as Route, icon: Layers },
      { label: "Industries", href: "/admin/industries" as Route, icon: Building2 },
      { label: "Clients", href: "/admin/clients" as Route, icon: Handshake },
      { label: "Videos", href: "/admin/videos" as Route, icon: Clapperboard },
      { label: "Technologies", href: "/admin/technologies" as Route, icon: Cpu },
      { label: "Stats", href: "/admin/stats" as Route, icon: ChartColumn },
      { label: "Now page", href: "/admin/now" as Route, icon: Clock },
    ],
  },
  {
    label: "Media",
    items: [
      { label: "Media Library", href: "/admin/media" as Route, icon: Images },
      { label: "Resume", href: "/admin/resume" as Route, icon: FileText },
    ],
  },
  {
    label: "Communication",
    items: [{ label: "Messages", href: "/admin/messages" as Route, icon: Inbox, badge: "unread" }],
  },
  {
    label: "Settings",
    items: [
      { label: "Social Links", href: "/admin/social-links" as Route, icon: Link2 },
      { label: "SEO", href: "/admin/seo" as Route, icon: Globe },
      { label: "Site Settings", href: "/admin/settings" as Route, icon: Settings },
      { label: "Analytics", href: "/admin/analytics" as Route, icon: ChartLine },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

export function isNavItemActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Longest matching nav item for the current pathname (for the top-bar title). */
export function findActiveNavItem(pathname: string): NavItem | undefined {
  return NAV_ITEMS.filter((item) => isNavItemActive(item.href, pathname)).sort(
    (a, b) => b.href.length - a.href.length,
  )[0];
}
