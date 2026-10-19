"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Link as LinkIcon, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { deleteSocialLink, reorderSocialLinks, toggleSocialLink } from "@/lib/actions/social-links";
import { cn } from "@/lib/utils/cn";
import type { SocialLink } from "@/types";
import { PLACEHOLDER_URLS, PLATFORM_LABELS, PlatformIcon, isSocialPlatform } from "./platform-icon";
import { SocialLinkDrawer } from "./social-link-form";

type DrawerState = { mode: "create" } | { mode: "edit"; link: SocialLink } | null;

export function SocialLinksManager({ initialLinks }: { initialLinks: SocialLink[] }) {
  const router = useRouter();
  const [links, setLinks] = React.useState(initialLinks);
  const [drawer, setDrawer] = React.useState<DrawerState>(null);
  const [deleting, setDeleting] = React.useState<SocialLink | null>(null);

  const reorder = useAction(reorderSocialLinks);
  const toggle = useAction(toggleSocialLink);
  const remove = useAction(deleteSocialLink);

  const visibleCount = links.filter((l) => l.is_visible).length;

  const handleReorder = async (ids: string[], next: SocialLink[]) => {
    const previous = links;
    setLinks(next);
    const res = await reorder.run([ids], { silent: true });
    if (!res?.ok) setLinks(previous);
    else router.refresh();
  };

  const handleToggle = async (link: SocialLink, value: boolean) => {
    const previous = links;
    setLinks((cur) => cur.map((l) => (l.id === link.id ? { ...l, is_visible: value } : l)));
    const res = await toggle.run([link.id, "is_visible", value]);
    if (!res?.ok) setLinks(previous);
    else router.refresh();
  };

  const handleSaved = (saved: SocialLink) => {
    setLinks((cur) => {
      const exists = cur.some((l) => l.id === saved.id);
      return exists ? cur.map((l) => (l.id === saved.id ? saved : l)) : [...cur, saved];
    });
    setDrawer(null);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    await remove.run([id], {
      onSuccess: () => {
        setLinks((cur) => cur.filter((l) => l.id !== id));
        setDeleting(null);
        router.refresh();
      },
    });
  };

  return (
    <>
      <AdminPageHeader
        title="Social links"
        count={links.length}
        description={`${visibleCount} visible. Drag to reorder; the order is used in the footer.`}
        actions={
          <Button size="sm" onClick={() => setDrawer({ mode: "create" })}>
            <Plus className="h-4 w-4" /> Add link
          </Button>
        }
      />

      {links.length === 0 ? (
        <EmptyState
          icon={LinkIcon}
          title="No social links yet"
          description="Add GitHub, LinkedIn, X or anywhere else people can find you."
          action={
            <Button size="sm" onClick={() => setDrawer({ mode: "create" })}>
              <Plus className="h-4 w-4" /> Add link
            </Button>
          }
        />
      ) : (
        <SortableList
          items={links}
          onReorder={handleReorder}
          disabled={reorder.pending}
          renderItem={(link, handle) => {
            const label = isSocialPlatform(link.platform)
              ? PLATFORM_LABELS[link.platform]
              : link.platform;
            const placeholder = PLACEHOLDER_URLS.has(link.url);
            return (
              <>
                {handle}
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-line-700 bg-surface-800",
                    link.is_visible ? "text-fg-100" : "text-fg-500",
                  )}
                >
                  <PlatformIcon platform={link.platform} className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        link.is_visible ? "text-fg-50" : "text-fg-300",
                      )}
                    >
                      {label}
                    </span>
                    {link.username ? (
                      <span className="text-xs text-fg-500">{link.username}</span>
                    ) : null}
                    {placeholder ? (
                      <Badge tone="amber">Placeholder — add your real URL</Badge>
                    ) : null}
                  </div>
                  {placeholder ? (
                    <span className="block truncate font-mono text-[11px] text-fg-500">
                      {link.url}
                    </span>
                  ) : (
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex max-w-full items-center gap-1 truncate font-mono text-[11px] text-fg-500 hover:text-fg-300"
                    >
                      <span className="truncate">{link.url}</span>
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  )}
                </div>
                <Switch
                  checked={link.is_visible}
                  onCheckedChange={(v) => void handleToggle(link, v)}
                  aria-label={`${link.is_visible ? "Hide" : "Show"} ${label}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${label}`}
                  onClick={() => setDrawer({ mode: "edit", link })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${label}`}
                  className="hover:text-crimson-400"
                  onClick={() => setDeleting(link)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            );
          }}
        />
      )}

      <SocialLinkDrawer
        open={drawer !== null}
        onOpenChange={(open) => !open && setDrawer(null)}
        link={drawer?.mode === "edit" ? drawer.link : null}
        nextOrder={links.length + 1}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this link?"
        description={
          deleting
            ? `${isSocialPlatform(deleting.platform) ? PLATFORM_LABELS[deleting.platform] : deleting.platform} · ${deleting.url}`
            : undefined
        }
        onConfirm={handleDelete}
        loading={remove.pending}
      />
    </>
  );
}
