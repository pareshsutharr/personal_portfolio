"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowLeft,
  Copy,
  Eye,
  EyeOff,
  FileEdit,
  FolderKanban,
  Globe,
  ListOrdered,
  Lock,
  Pencil,
  RotateCcw,
  Search,
  Send,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Checkbox, Input } from "@/components/ui/input";
import { Tabs } from "@/components/ui/panel";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useAction } from "@/hooks/use-action";
import {
  bulkDeletePermanently,
  bulkRestore,
  bulkSetStatus,
  bulkSoftDelete,
  deleteProjectPermanently,
  duplicateProject,
  reorderProjects,
  restoreProject,
  setProjectStatus,
  softDeleteProject,
  toggleProjectFlag,
} from "@/lib/actions/projects";
import { cn } from "@/lib/utils/cn";
import { relativeTime } from "@/lib/utils/format";
import type { Project, ProjectStatus, ProjectVisibility } from "@/types";
import { ProjectThumb } from "./project-thumb";
import { RowMenu, type RowMenuItem } from "./row-menu";

export type ProjectRow = Pick<
  Project,
  | "id"
  | "title"
  | "slug"
  | "category"
  | "client"
  | "status"
  | "visibility"
  | "featured"
  | "confidential"
  | "thumbnail"
  | "cover_image"
  | "updated_at"
  | "deleted_at"
  | "display_order"
> & { industry: { name: string } | null };

export type ProjectFilters = {
  status: "all" | ProjectStatus;
  q: string;
  featured: boolean;
  trash: boolean;
};

export type ProjectCounts = {
  all: number;
  draft: number;
  published: number;
  archived: number;
  trash: number;
};

const STATUS_TONE: Record<ProjectStatus, "neutral" | "success" | "outline"> = {
  draft: "neutral",
  published: "success",
  archived: "outline",
};

const VISIBILITY_ICON: Record<ProjectVisibility, React.ComponentType<{ className?: string }>> = {
  public: Globe,
  private: Lock,
  unlisted: EyeOff,
};

type Confirm =
  | { kind: "trash"; ids: string[]; title?: string }
  | { kind: "delete"; ids: string[]; title?: string };

export function ProjectsTable({
  rows,
  counts,
  filters,
}: {
  rows: ProjectRow[];
  counts: ProjectCounts;
  filters: ProjectFilters;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = React.useState(filters.q);
  const [selected, setSelected] = React.useState<Set<string>>(() => new Set());
  const [reorderMode, setReorderMode] = React.useState(false);
  const [confirm, setConfirm] = React.useState<Confirm | null>(null);
  // Optimistic order for reorder mode; falls back to server rows when they change.
  const [localOrder, setLocalOrder] = React.useState<{
    source: ProjectRow[];
    items: ProjectRow[];
  } | null>(null);
  const items = localOrder && localOrder.source === rows ? localOrder.items : rows;

  const status = useAction(setProjectStatus);
  const flag = useAction(toggleProjectFlag);
  const trash = useAction(softDeleteProject);
  const restore = useAction(restoreProject);
  const destroy = useAction(deleteProjectPermanently);
  const duplicate = useAction(duplicateProject);
  const reorder = useAction(reorderProjects);
  const bulkStatus = useAction(bulkSetStatus);
  const bulkTrash = useAction(bulkSoftDelete);
  const bulkRestoreAction = useAction(bulkRestore);
  const bulkDestroy = useAction(bulkDeletePermanently);

  const pending =
    status.pending ||
    flag.pending ||
    trash.pending ||
    restore.pending ||
    destroy.pending ||
    duplicate.pending ||
    reorder.pending ||
    bulkStatus.pending ||
    bulkTrash.pending ||
    bulkRestoreAction.pending ||
    bulkDestroy.pending;

  const filtersActive = filters.status !== "all" || filters.q !== "" || filters.featured;
  const canReorder = !filtersActive && !filters.trash && rows.length > 1;

  const setParams = React.useCallback(
    (patch: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === "") params.delete(k);
        else params.set(k, v);
      }
      const qs = params.toString();
      router.replace((qs ? `${pathname}?${qs}` : pathname) as Route);
    },
    [pathname, router, searchParams],
  );

  // Debounced search → URL.
  React.useEffect(() => {
    if (search === filters.q) return;
    const t = window.setTimeout(() => setParams({ q: search.trim() || null }), 300);
    return () => window.clearTimeout(t);
  }, [search, filters.q, setParams]);

  const refresh = React.useCallback(() => {
    setSelected(new Set());
    router.refresh();
  }, [router]);

  const toggleSelected = (id: string, value: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (value) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  const allSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));
  const selectedIds = rows.filter((r) => selected.has(r.id)).map((r) => r.id);

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, ids } = confirm;
    const single = ids.length === 1;
    if (kind === "trash") {
      await (single
        ? trash.run([ids[0]], { onSuccess: refresh })
        : bulkTrash.run([ids], { onSuccess: refresh }));
    } else {
      await (single
        ? destroy.run([ids[0]], { onSuccess: refresh })
        : bulkDestroy.run([ids], { onSuccess: refresh }));
    }
    setConfirm(null);
  };

  const menuFor = (row: ProjectRow): RowMenuItem[] => {
    if (filters.trash) {
      return [
        {
          label: "Restore",
          icon: RotateCcw,
          onSelect: () => void restore.run([row.id], { onSuccess: refresh }),
        },
        { type: "separator" },
        {
          label: "Delete permanently",
          icon: Trash2,
          danger: true,
          onSelect: () => setConfirm({ kind: "delete", ids: [row.id], title: row.title }),
        },
      ];
    }
    return [
      { label: "Edit", icon: Pencil, href: `/admin/projects/${row.id}` },
      { label: "Preview", icon: Eye, href: `/preview/projects/${row.slug}`, external: true },
      {
        label: "Duplicate",
        icon: Copy,
        onSelect: () =>
          void duplicate.run([row.id], {
            onSuccess: (p) => router.push(`/admin/projects/${p.id}` as Route),
          }),
      },
      { type: "separator" },
      row.status === "published"
        ? {
            label: "Unpublish",
            icon: FileEdit,
            onSelect: () => void status.run([row.id, "draft"], { onSuccess: refresh }),
          }
        : {
            label: "Publish",
            icon: Send,
            onSelect: () => void status.run([row.id, "published"], { onSuccess: refresh }),
          },
      {
        label: row.status === "archived" ? "Unarchive" : "Archive",
        icon: Archive,
        onSelect: () =>
          void status.run([row.id, row.status === "archived" ? "draft" : "archived"], {
            onSuccess: refresh,
          }),
      },
      { type: "separator" },
      {
        label: "Move to trash",
        icon: Trash2,
        danger: true,
        onSelect: () => setConfirm({ kind: "trash", ids: [row.id], title: row.title }),
      },
    ];
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        {filters.trash ? (
          <Link
            href="/admin/projects"
            className="inline-flex h-9 items-center gap-2 text-sm text-fg-300 hover:text-fg-50"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Back to projects
            <span className="font-mono text-[11px] text-fg-500">· Trash ({counts.trash})</span>
          </Link>
        ) : (
          <Tabs
            className="border-b-0"
            value={filters.status}
            onChange={(v) => setParams({ status: v === "all" ? null : v })}
            tabs={[
              { value: "all", label: "All", count: counts.all },
              { value: "draft", label: "Draft", count: counts.draft },
              { value: "published", label: "Published", count: counts.published },
              { value: "archived", label: "Archived", count: counts.archived },
            ]}
          />
        )}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-fg-500"
              aria-hidden
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search title, category, client…"
              aria-label="Search projects"
              className="h-9 w-64 pl-8 text-[13px]"
            />
            {search ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute top-1/2 right-2 -translate-y-1/2 text-fg-500 hover:text-fg-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          {!filters.trash ? (
            <Button
              type="button"
              size="sm"
              variant={filters.featured ? "secondary" : "ghost"}
              aria-pressed={filters.featured}
              onClick={() => setParams({ featured: filters.featured ? null : "1" })}
              className="h-9"
            >
              <Star
                className={cn("h-3.5 w-3.5", filters.featured && "fill-ember-400 text-ember-400")}
              />
              Featured
            </Button>
          ) : null}
          {!filters.trash ? (
            <Button
              type="button"
              size="sm"
              variant={reorderMode ? "secondary" : "ghost"}
              aria-pressed={reorderMode}
              disabled={!canReorder}
              title={canReorder ? "Drag projects into display order" : "Clear filters to reorder"}
              onClick={() => setReorderMode((v) => !v)}
              className="h-9"
            >
              <ListOrdered className="h-3.5 w-3.5" />
              {reorderMode ? "Done" : "Reorder"}
            </Button>
          ) : null}
          {!filters.trash ? (
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setParams({ trash: "1", status: null, featured: null, q: null })}
              className="h-9"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Trash
              {counts.trash > 0 ? (
                <span className="rounded-xs bg-surface-700 px-1.5 py-0.5 font-mono text-[10px] text-fg-300">
                  {counts.trash}
                </span>
              ) : null}
            </Button>
          ) : null}
        </div>
      </div>

      {/* Bulk bar */}
      {selectedIds.length > 0 && !reorderMode ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-line-700 bg-surface-800 px-3 py-2">
          <span className="mr-2 font-mono text-[11px] tracking-wider text-fg-100 uppercase">
            {selectedIds.length} selected
          </span>
          {filters.trash ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                loading={bulkRestoreAction.pending}
                onClick={() => void bulkRestoreAction.run([selectedIds], { onSuccess: refresh })}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restore
              </Button>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setConfirm({ kind: "delete", ids: selectedIds })}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete permanently
              </Button>
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                loading={bulkStatus.pending}
                onClick={() =>
                  void bulkStatus.run([selectedIds, "published"], { onSuccess: refresh })
                }
              >
                <Send className="h-3.5 w-3.5" /> Publish
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={bulkStatus.pending}
                onClick={() => void bulkStatus.run([selectedIds, "draft"], { onSuccess: refresh })}
              >
                <FileEdit className="h-3.5 w-3.5" /> Unpublish
              </Button>
              <Button
                size="sm"
                variant="secondary"
                loading={bulkStatus.pending}
                onClick={() =>
                  void bulkStatus.run([selectedIds, "archived"], { onSuccess: refresh })
                }
              >
                <Archive className="h-3.5 w-3.5" /> Archive
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-crimson-400"
                onClick={() => setConfirm({ kind: "trash", ids: selectedIds })}
              >
                <Trash2 className="h-3.5 w-3.5" /> Move to trash
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="ghost"
            className="ml-auto"
            onClick={() => setSelected(new Set())}
          >
            Clear
          </Button>
        </div>
      ) : null}

      {/* Content */}
      {rows.length === 0 ? (
        <EmptyState
          icon={filters.trash ? Trash2 : FolderKanban}
          title={
            filters.trash
              ? "Trash is empty"
              : filtersActive
                ? "No projects match"
                : "No projects yet"
          }
          description={
            filters.trash
              ? "Projects you move to trash appear here and can be restored."
              : filtersActive
                ? "Try a different status, clear the search, or remove the featured filter."
                : "Add your first project to start building the case-study library."
          }
          action={
            filtersActive ? (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSearch("");
                  setParams({ status: null, q: null, featured: null });
                }}
              >
                Clear filters
              </Button>
            ) : !filters.trash ? (
              <Link
                href="/admin/projects/new"
                className="text-sm text-ember-400 underline-offset-4 hover:underline"
              >
                Add project
              </Link>
            ) : undefined
          }
        />
      ) : reorderMode ? (
        <SortableList
          items={items}
          disabled={reorder.pending}
          onReorder={(ids, next) => {
            setLocalOrder({ source: rows, items: next });
            void reorder.run([ids], { onSuccess: () => router.refresh() });
          }}
          renderItem={(row, handle, index) => (
            <>
              {handle}
              <span className="w-6 font-mono text-[11px] text-fg-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <ProjectThumb src={row.thumbnail ?? row.cover_image} title={row.title} size={32} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg-50">{row.title}</p>
                <p className="truncate font-mono text-[11px] text-fg-500">
                  {row.category ?? row.slug}
                </p>
              </div>
              <Badge tone={STATUS_TONE[row.status]} mono>
                {row.status}
              </Badge>
            </>
          )}
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH className="w-10">
                <Checkbox
                  aria-label="Select all"
                  checked={allSelected}
                  onChange={(e) =>
                    setSelected(e.target.checked ? new Set(rows.map((r) => r.id)) : new Set())
                  }
                />
              </TH>
              <TH className="w-14">
                <span className="sr-only">Thumbnail</span>
              </TH>
              <TH>Project</TH>
              <TH>Industry</TH>
              <TH>Status</TH>
              <TH>Visibility</TH>
              <TH className="w-20 text-center">Featured</TH>
              <TH className="w-14 text-center">
                <span title="Confidential">Conf.</span>
              </TH>
              <TH>Updated</TH>
              <TH className="w-12">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {rows.map((row) => {
              const VisIcon = VISIBILITY_ICON[row.visibility];
              const isSelected = selected.has(row.id);
              return (
                <TR key={row.id} data-state={isSelected ? "selected" : undefined}>
                  <TD>
                    <Checkbox
                      aria-label={`Select ${row.title}`}
                      checked={isSelected}
                      onChange={(e) => toggleSelected(row.id, e.target.checked)}
                    />
                  </TD>
                  <TD className="pr-0">
                    <ProjectThumb src={row.thumbnail ?? row.cover_image} title={row.title} />
                  </TD>
                  <TD className="max-w-[320px]">
                    <div className="flex items-center gap-2">
                      {filters.trash ? (
                        <span className="truncate text-sm font-medium text-fg-100">
                          {row.title}
                        </span>
                      ) : (
                        <Link
                          href={`/admin/projects/${row.id}` as Route}
                          className="truncate text-sm font-medium text-fg-50 hover:text-ember-300"
                        >
                          {row.title}
                        </Link>
                      )}
                    </div>
                    <p className="mt-0.5 truncate font-mono text-[11px] text-fg-500">
                      /{row.slug}
                      {row.category ? <span className="text-fg-700"> · </span> : null}
                      {row.category ? <span className="text-fg-300">{row.category}</span> : null}
                    </p>
                  </TD>
                  <TD className="text-[13px] whitespace-nowrap text-fg-300">
                    {row.industry?.name ?? <span className="text-fg-700">—</span>}
                  </TD>
                  <TD>
                    <Badge tone={STATUS_TONE[row.status]} mono>
                      {row.status}
                    </Badge>
                  </TD>
                  <TD>
                    <span className="inline-flex items-center gap-1.5 font-mono text-[11px] tracking-wider text-fg-300 uppercase">
                      <VisIcon className="h-3.5 w-3.5" aria-hidden />
                      {row.visibility}
                    </span>
                  </TD>
                  <TD className="text-center">
                    <button
                      type="button"
                      aria-pressed={row.featured}
                      aria-label={row.featured ? "Remove from featured" : "Mark as featured"}
                      disabled={filters.trash || flag.pending}
                      onClick={() =>
                        void flag.run([row.id, "featured", !row.featured], {
                          silent: true,
                          onSuccess: () => router.refresh(),
                        })
                      }
                      className={cn(
                        "inline-flex h-8 w-8 items-center justify-center rounded-sm transition-colors disabled:opacity-50",
                        row.featured
                          ? "text-ember-400 hover:bg-ember-500/10"
                          : "text-fg-700 hover:bg-surface-800 hover:text-fg-300",
                      )}
                    >
                      <Star className={cn("h-4 w-4", row.featured && "fill-current")} />
                    </button>
                  </TD>
                  <TD className="text-center">
                    {row.confidential ? (
                      <span className="inline-flex text-amber-300" title="Confidential project">
                        <Lock className="h-3.5 w-3.5" aria-hidden />
                        <span className="sr-only">Confidential</span>
                      </span>
                    ) : (
                      <span className="text-fg-700">—</span>
                    )}
                  </TD>
                  <TD className="text-[12px] whitespace-nowrap text-fg-500">
                    <time dateTime={row.deleted_at ?? row.updated_at} suppressHydrationWarning>
                      {filters.trash && row.deleted_at
                        ? `trashed ${relativeTime(row.deleted_at)}`
                        : relativeTime(row.updated_at)}
                    </time>
                  </TD>
                  <TD className="text-right">
                    <RowMenu items={menuFor(row)} label={`Actions for ${row.title}`} />
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      )}

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={
          confirm?.kind === "delete"
            ? confirm.ids.length === 1
              ? `Delete “${confirm.title ?? "project"}” permanently?`
              : `Delete ${confirm.ids.length} projects permanently?`
            : confirm?.ids.length === 1
              ? `Move “${confirm.title ?? "project"}” to trash?`
              : `Move ${confirm?.ids.length ?? 0} projects to trash?`
        }
        description={
          confirm?.kind === "delete"
            ? "Features, gallery entries and technology links are removed with it. Files stay in the media library."
            : "Trashed projects disappear from the public site immediately. You can restore them later."
        }
        confirmLabel={confirm?.kind === "delete" ? "Delete permanently" : "Move to trash"}
        loading={pending}
        onConfirm={runConfirm}
      />
    </div>
  );
}
