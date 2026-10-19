"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, ExternalLink, LogOut, Menu, Search, X } from "lucide-react";
import { signOut } from "@/lib/actions/auth";
import { cn } from "@/lib/utils/cn";
import { Kbd } from "@/components/ui/panel";
import { Button } from "@/components/ui/button";
import { CommandPalette } from "./command-palette";
import { NAV_GROUPS, findActiveNavItem, isNavItemActive, type NavItem } from "./nav-config";

type ShellProps = {
  user: { email: string };
  unreadCount: number;
  children: React.ReactNode;
};

export function AdminShell({ user, unreadCount, children }: ShellProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [paletteOpen, setPaletteOpen] = React.useState(false);

  // Close the mobile drawer when the route changes (state adjusted during render).
  const [prevPathname, setPrevPathname] = React.useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMobileOpen(false);
  }

  const active = findActiveNavItem(pathname);
  const title = active?.label ?? "Admin";
  const isDashboard = pathname === "/admin";

  return (
    <div className="flex min-h-screen bg-bg-950 text-fg-100">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line-800 bg-bg-900 lg:flex">
        <Brand />
        <SidebarNav pathname={pathname} unreadCount={unreadCount} />
        <SidebarFooter email={user.email} />
      </aside>

      {/* Mobile drawer */}
      {mobileOpen ? (
        <div
          className="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="Navigation"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="animate-in slide-in-from-left absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-line-800 bg-bg-900 duration-200">
            <div className="flex items-center justify-between pr-2">
              <Brand />
              <Button
                variant="ghost"
                size="icon"
                aria-label="Close menu"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <SidebarNav pathname={pathname} unreadCount={unreadCount} />
            <SidebarFooter email={user.email} />
          </div>
        </div>
      ) : null}

      {/* Main column */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line-800 bg-bg-950/85 px-4 backdrop-blur lg:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            aria-label="Open menu"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-4 w-4" />
          </Button>

          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-sm">
            <Link
              href="/admin"
              className={cn(
                "shrink-0 transition-colors",
                isDashboard ? "font-medium text-fg-50" : "text-fg-500 hover:text-fg-100",
              )}
            >
              Admin
            </Link>
            {!isDashboard ? (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-fg-700" aria-hidden />
                <span className="truncate font-medium text-fg-50">{title}</span>
              </>
            ) : null}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            <button
              type="button"
              onClick={() => setPaletteOpen(true)}
              className="hidden h-8 items-center gap-2 rounded-sm border border-line-700 bg-surface-900 px-2.5 text-xs text-fg-500 transition-colors hover:border-line-600 hover:text-fg-100 sm:flex"
            >
              <Search className="h-3.5 w-3.5" aria-hidden />
              <span>Search</span>
              <span className="flex items-center gap-0.5">
                <Kbd>⌘</Kbd>
                <Kbd>K</Kbd>
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label="Search"
              onClick={() => setPaletteOpen(true)}
            >
              <Search className="h-4 w-4" />
            </Button>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-8 items-center gap-1.5 rounded-sm px-2.5 text-xs text-fg-300 transition-colors hover:bg-surface-800 hover:text-fg-50"
            >
              View site
              <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
            <span className="hidden max-w-[180px] truncate font-mono text-[11px] text-fg-500 xl:inline">
              {user.email}
            </span>
            <form action={signOut} className="hidden lg:block">
              <Button
                type="submit"
                variant="ghost"
                size="icon"
                aria-label="Sign out"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} unreadCount={unreadCount} />
    </div>
  );
}

function Brand() {
  return (
    <Link href="/admin" className="flex h-14 shrink-0 items-center gap-2.5 px-4">
      <span className="flex h-6 w-6 items-center justify-center rounded-xs bg-fg-50 font-mono text-[11px] font-semibold text-bg-950">
        PS
      </span>
      <span className="flex flex-col leading-none">
        <span className="label-mono text-fg-100">Paresh Suthar</span>
        <span className="mt-1 font-mono text-[10px] tracking-widest text-fg-500 uppercase">
          Admin
        </span>
      </span>
    </Link>
  );
}

function SidebarNav({ pathname, unreadCount }: { pathname: string; unreadCount: number }) {
  return (
    <nav aria-label="Admin" className="flex-1 scrollbar-thin overflow-y-auto px-3 pt-1 pb-4">
      {NAV_GROUPS.map((group, i) => (
        <div key={group.label ?? "root"} className={cn(i > 0 && "mt-5")}>
          {group.label ? <p className="mb-1.5 px-2 label-mono">{group.label}</p> : null}
          <ul className="space-y-px">
            {group.items.map((item) => (
              <li key={item.href}>
                <NavLink
                  item={item}
                  active={isNavItemActive(item.href, pathname)}
                  unreadCount={unreadCount}
                />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function NavLink({
  item,
  active,
  unreadCount,
}: {
  item: NavItem;
  active: boolean;
  unreadCount: number;
}) {
  const Icon = item.icon;
  const badge = item.badge === "unread" && unreadCount > 0 ? unreadCount : null;
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-8 items-center gap-2.5 rounded-sm px-2 text-[13px] transition-colors",
        active
          ? "bg-surface-800 text-fg-50"
          : "text-fg-300 hover:bg-surface-800/60 hover:text-fg-50",
      )}
    >
      {active ? (
        <span
          aria-hidden
          className="absolute top-1.5 bottom-1.5 -left-3 w-0.5 rounded-r-full bg-ember-500"
        />
      ) : null}
      <Icon
        className={cn(
          "h-4 w-4 shrink-0",
          active ? "text-ember-400" : "text-fg-500 group-hover:text-fg-300",
        )}
        aria-hidden
      />
      <span className="truncate">{item.label}</span>
      {badge !== null ? (
        <span className="ml-auto rounded-xs bg-ember-500/15 px-1.5 py-0.5 font-mono text-[10px] leading-none text-ember-300">
          {badge > 99 ? "99+" : badge}
        </span>
      ) : null}
    </Link>
  );
}

function SidebarFooter({ email }: { email: string }) {
  return (
    <div className="flex items-center gap-2 border-t border-line-800 px-3 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-sm bg-surface-700 font-mono text-[11px] text-fg-300 uppercase">
        {email.slice(0, 1) || "A"}
      </span>
      <span className="min-w-0 flex-1 truncate text-xs text-fg-300" title={email}>
        {email || "Admin"}
      </span>
      <form action={signOut}>
        <Button
          type="submit"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
        </Button>
      </form>
    </div>
  );
}
