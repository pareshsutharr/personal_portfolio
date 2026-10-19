"use client";

import * as React from "react";
import Image from "next/image";
import { Pencil, Search, Trash2, type LucideIcon } from "lucide-react";
import { SortableList } from "@/components/admin/sortable-list";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Switch } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";

/** What a row shows. `title`/`subtitle` are plain strings so the list can search them. */
export type EntityRow = {
  title: string;
  subtitle?: string | null;
  meta?: React.ReactNode;
  badges?: React.ReactNode;
  /** Thumbnail / avatar rendered before the title. */
  leading?: React.ReactNode;
};

export type ToggleField = "is_visible" | "featured" | "is_featured";

type Entry<T> = { id: string; item: T; row: EntityRow };

/**
 * Generic sortable admin list: drag handle, visibility switch, edit + delete,
 * optimistic reorder/toggle with rollback, confirm dialog, empty state and an
 * optional client-side search. Compose it per entity with your own `renderRow`.
 */
export function EntityList<
  T extends { id: string } & Partial<Record<ToggleField, boolean>>,
  F extends ToggleField = "is_visible",
>({
  items,
  renderRow,
  onEdit,
  onDelete,
  onToggle,
  toggleField,
  onReorder,
  emptyState,
  searchable = false,
  searchPlaceholder = "Search…",
  className,
}: {
  items: T[];
  renderRow: (item: T, index: number) => EntityRow;
  onEdit: (item: T) => void;
  /** Resolve `true` when the delete succeeded so the dialog closes. */
  onDelete: (item: T) => Promise<boolean>;
  /** Resolve `true` when persisted; `false` rolls the switch back. */
  onToggle?: (item: T, field: F, value: boolean) => Promise<boolean>;
  toggleField?: F;
  /** Resolve `true` when persisted; `false` rolls the order back. */
  onReorder: (ids: string[]) => Promise<boolean>;
  emptyState: { title: string; description?: string; icon?: LucideIcon; action?: React.ReactNode };
  searchable?: boolean;
  searchPlaceholder?: string;
  className?: string;
}) {
  const field = (toggleField ?? "is_visible") as F;

  // Local copy for optimistic updates; re-synced whenever the server list changes.
  const [prevItems, setPrevItems] = React.useState(items);
  const [order, setOrder] = React.useState(items);
  if (prevItems !== items) {
    setPrevItems(items);
    setOrder(items);
  }

  const [query, setQuery] = React.useState("");
  const [pendingDelete, setPendingDelete] = React.useState<Entry<T> | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const entries: Entry<T>[] = order.map((item, index) => ({
    id: item.id,
    item,
    row: renderRow(item, index),
  }));

  const q = query.trim().toLowerCase();
  const visible = q
    ? entries.filter((e) => `${e.row.title} ${e.row.subtitle ?? ""}`.toLowerCase().includes(q))
    : entries;

  async function handleReorder(_ids: string[], next: Entry<T>[]) {
    const previous = order;
    setOrder(next.map((e) => e.item));
    const persisted = await onReorder(next.map((e) => e.id));
    if (!persisted) setOrder(previous);
  }

  async function handleToggle(item: T, value: boolean) {
    if (!onToggle) return;
    const previous = order;
    setOrder((prev) => prev.map((i) => (i.id === item.id ? { ...i, [field]: value } : i)));
    const persisted = await onToggle(item, field, value);
    if (!persisted) setOrder(previous);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setDeleting(true);
    const removed = await onDelete(pendingDelete.item);
    setDeleting(false);
    if (removed) setPendingDelete(null);
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={emptyState.icon}
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {searchable ? (
        <div className="flex items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-fg-500"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label="Search list"
              className="h-9 pl-9"
            />
          </div>
          <span className="font-mono text-[11px] tracking-wider text-fg-500 uppercase">
            {q ? `${visible.length} of ${entries.length}` : `${entries.length} items`}
          </span>
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="rounded-md border border-dashed border-line-800 px-4 py-8 text-center text-sm text-fg-500">
          No matches for “{query.trim()}”.
        </p>
      ) : (
        <SortableList
          items={visible}
          disabled={q !== ""}
          onReorder={(ids, next) => void handleReorder(ids, next)}
          renderItem={(entry, handle) => {
            const { title, subtitle, meta, badges, leading } = entry.row;
            const shown = onToggle ? entry.item[field] !== false : true;
            return (
              <>
                {handle}
                {leading}
                <div className={cn("min-w-0 flex-1", !shown && "opacity-50")}>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="truncate text-sm font-medium text-fg-100">{title}</span>
                    {badges}
                  </div>
                  {subtitle ? (
                    <p className="mt-0.5 truncate text-xs text-fg-500">{subtitle}</p>
                  ) : null}
                </div>
                {meta ? (
                  <div className="hidden shrink-0 font-mono text-[11px] text-fg-500 sm:block">
                    {meta}
                  </div>
                ) : null}
                {onToggle ? (
                  <Switch
                    checked={shown}
                    onCheckedChange={(v) => void handleToggle(entry.item, v)}
                    aria-label={shown ? `Hide ${title}` : `Show ${title}`}
                  />
                ) : null}
                <div className="flex shrink-0 items-center">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label={`Edit ${title}`}
                    onClick={() => onEdit(entry.item)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 hover:text-crimson-400"
                    aria-label={`Delete ${title}`}
                    onClick={() => setPendingDelete(entry)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </>
            );
          }}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(o) => {
          if (!o && !deleting) setPendingDelete(null);
        }}
        title={pendingDelete ? `Delete “${pendingDelete.row.title}”?` : "Delete?"}
        description="It will be removed from the public site immediately."
        onConfirm={confirmDelete}
        loading={deleting}
      />
    </div>
  );
}

/** Small square/video thumbnail for list rows. Falls back to a placeholder. */
export function EntityThumb({
  src,
  alt,
  shape = "square",
  fallback,
}: {
  src: string | null | undefined;
  alt: string;
  shape?: "square" | "video";
  fallback?: React.ReactNode;
}) {
  const isStorage = src?.includes("/storage/v1/object/public/") ?? false;
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-sm border border-line-700 bg-surface-800",
        shape === "square" ? "h-9 w-9" : "h-9 w-16",
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="64px"
          className="object-cover"
          unoptimized={!isStorage || src.endsWith(".svg")}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-fg-700">{fallback}</div>
      )}
    </div>
  );
}
