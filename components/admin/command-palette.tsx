"use client";

import * as React from "react";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Command } from "cmdk";
import {
  Award,
  Briefcase,
  ExternalLink,
  FileUp,
  FolderKanban,
  Inbox,
  Loader2,
  LogOut,
  Plus,
  Search,
  Settings,
  User,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { searchProjects, type ProjectSearchHit } from "@/lib/actions/search";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/badge";
import { Kbd } from "@/components/ui/panel";
import { NAV_ITEMS } from "./nav-config";

type QuickCommand = {
  id: string;
  label: string;
  icon: LucideIcon;
  keywords?: string[];
  href?: Route;
  external?: string;
  action?: "sign-out";
};

const QUICK_COMMANDS: QuickCommand[] = [
  {
    id: "add-project",
    label: "Add project",
    icon: Plus,
    keywords: ["new", "create"],
    href: "/admin/projects/new" as Route,
  },
  {
    id: "add-certification",
    label: "Add certification",
    icon: Award,
    keywords: ["new", "create"],
    href: "/admin/certifications?new=1" as Route,
  },
  {
    id: "add-experience",
    label: "Add experience",
    icon: Briefcase,
    keywords: ["new", "create", "job"],
    href: "/admin/experience?new=1" as Route,
  },
  {
    id: "edit-profile",
    label: "Edit profile",
    icon: User,
    keywords: ["bio", "hero"],
    href: "/admin/profile" as Route,
  },
  {
    id: "open-messages",
    label: "Open messages",
    icon: Inbox,
    keywords: ["inbox", "leads", "contact"],
    href: "/admin/messages" as Route,
  },
  {
    id: "upload-resume",
    label: "Upload resume",
    icon: FileUp,
    keywords: ["cv", "pdf"],
    href: "/admin/resume" as Route,
  },
  {
    id: "open-settings",
    label: "Open settings",
    icon: Settings,
    keywords: ["site", "config"],
    href: "/admin/settings" as Route,
  },
  {
    id: "view-site",
    label: "View public site",
    icon: ExternalLink,
    keywords: ["home", "preview"],
    external: "/",
  },
  {
    id: "sign-out",
    label: "Sign out",
    icon: LogOut,
    keywords: ["logout", "exit"],
    action: "sign-out",
  },
];

const STATUS_TONE: Record<ProjectSearchHit["status"], "success" | "neutral" | "outline"> = {
  published: "success",
  draft: "neutral",
  archived: "outline",
};

const SEARCH_MIN = 2;
const subscribeNoop = () => () => {};

/**
 * ⌘K palette. Mounted once in the admin shell; the body (and its search
 * state) only exists while open, so closing resets it for free.
 */
export function CommandPalette({
  open,
  onOpenChange,
  unreadCount = 0,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unreadCount?: number;
}) {
  const mounted = React.useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  // Global shortcut.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      } else if (e.key === "Escape" && open) {
        onOpenChange(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Scroll lock while open.
  React.useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted || !open) return null;

  return createPortal(
    <PaletteBody onClose={() => onOpenChange(false)} unreadCount={unreadCount} />,
    document.body,
  );
}

type Hits = { q: string; rows: ProjectSearchHit[] };

function PaletteBody({ onClose, unreadCount }: { onClose: () => void; unreadCount: number }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [hits, setHits] = React.useState<Hits>({ q: "", rows: [] });
  const [, startTransition] = React.useTransition();

  const q = query.trim();
  const searchable = q.length >= SEARCH_MIN;
  // Derived: results are only shown for the query they were fetched for.
  const visibleHits = searchable && hits.q === q ? hits.rows : [];
  const searching = searchable && hits.q !== q;

  // Debounced project search; all state updates happen inside the timer callback.
  React.useEffect(() => {
    if (!searchable) return;
    let cancelled = false;
    const t = window.setTimeout(() => {
      void searchProjects(q).then((res) => {
        if (cancelled) return;
        setHits({ q, rows: res.ok ? res.data : [] });
      });
    }, 180);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [q, searchable]);

  const go = (href: Route) => {
    onClose();
    startTransition(() => router.push(href));
  };

  const runQuick = (cmd: QuickCommand) => {
    if (cmd.href) return go(cmd.href);
    if (cmd.external) {
      onClose();
      window.open(cmd.external, "_blank", "noopener,noreferrer");
      return;
    }
    if (cmd.action === "sign-out") {
      onClose();
      startTransition(() => {
        void signOut();
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        aria-hidden
        className="animate-in fade-in absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 top-[12vh] mx-auto w-full max-w-xl px-4">
        <Command
          label="Command palette"
          loop
          className="animate-in fade-in zoom-in-95 overflow-hidden rounded-lg border border-line-700 bg-surface-900 shadow-panel duration-150"
        >
          <div className="flex items-center gap-3 border-b border-line-800 px-4">
            {searching ? (
              <Loader2 className="h-4 w-4 shrink-0 animate-spin text-fg-500" aria-hidden />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-fg-500" aria-hidden />
            )}
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Jump to a page, run an action, or search projects…"
              className="h-12 w-full bg-transparent text-sm text-fg-50 outline-none placeholder:text-fg-500"
            />
            <Kbd>esc</Kbd>
          </div>

          <Command.List className="max-h-[60vh] scrollbar-thin overflow-y-auto p-2">
            <Command.Empty className="px-3 py-10 text-center text-sm text-fg-500">
              {searching ? "Searching…" : "No results."}
            </Command.Empty>

            {visibleHits.length > 0 ? (
              <Group heading="Projects">
                {visibleHits.map((p) => (
                  <Item
                    key={p.id}
                    value={`project ${p.title} ${p.slug} ${p.id}`}
                    icon={FolderKanban}
                    onSelect={() => go(`/admin/projects/${p.id}` as Route)}
                  >
                    <span className="truncate">{p.title}</span>
                    <span className="ml-2 truncate font-mono text-[11px] text-fg-500">
                      /{p.slug}
                    </span>
                    <Badge tone={STATUS_TONE[p.status]} mono className="ml-auto">
                      {p.status}
                    </Badge>
                  </Item>
                ))}
              </Group>
            ) : null}

            <Group heading="Actions">
              {QUICK_COMMANDS.map((cmd) => (
                <Item
                  key={cmd.id}
                  value={`action ${cmd.label}`}
                  keywords={cmd.keywords}
                  icon={cmd.icon}
                  onSelect={() => runQuick(cmd)}
                >
                  <span className="truncate">{cmd.label}</span>
                  {cmd.id === "open-messages" && unreadCount > 0 ? (
                    <span className="ml-auto rounded-xs bg-ember-500/15 px-1.5 py-0.5 font-mono text-[10px] leading-none text-ember-300">
                      {unreadCount}
                    </span>
                  ) : null}
                </Item>
              ))}
            </Group>

            <Group heading="Go to">
              {NAV_ITEMS.map((item) => (
                <Item
                  key={item.href}
                  value={`goto ${item.label}`}
                  keywords={[item.href.replace("/admin/", "").replace("/admin", "dashboard")]}
                  icon={item.icon}
                  onSelect={() => go(item.href)}
                >
                  <span className="truncate">{item.label}</span>
                  <span className="ml-auto font-mono text-[11px] text-fg-700">{item.href}</span>
                </Item>
              ))}
            </Group>
          </Command.List>

          <div className="flex items-center gap-4 border-t border-line-800 px-4 py-2 font-mono text-[10px] tracking-wider text-fg-500 uppercase">
            <span className="flex items-center gap-1">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <Kbd>↵</Kbd> select
            </span>
            <span className="ml-auto">Type {SEARCH_MIN}+ characters to search projects</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

function Group({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <Command.Group
      heading={heading}
      className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:pt-2 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:font-mono [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:tracking-[0.14em] [&_[cmdk-group-heading]]:text-fg-500 [&_[cmdk-group-heading]]:uppercase"
    >
      {children}
    </Command.Group>
  );
}

function Item({
  icon: Icon,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Command.Item> & { icon: LucideIcon }) {
  return (
    <Command.Item
      className={cn(
        "flex h-9 cursor-pointer items-center gap-2.5 rounded-sm px-2 text-[13px] text-fg-300 select-none",
        "data-[selected=true]:bg-surface-800 data-[selected=true]:text-fg-50",
        "[&[data-selected=true]_svg:first-child]:text-ember-400",
        className,
      )}
      {...props}
    >
      <Icon className="h-4 w-4 shrink-0 text-fg-500" aria-hidden />
      {children}
    </Command.Item>
  );
}
