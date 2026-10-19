"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { deleteIndustry, reorderIndustries, toggleIndustry } from "@/lib/actions/industries";
import { cn } from "@/lib/utils/cn";
import type { Industry } from "@/types";
import { IndustryDrawer } from "./industry-drawer";

export function IndustriesAdmin({
  industries: initial,
  counts,
}: {
  industries: Industry[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState(initial);
  const [drawer, setDrawer] = React.useState<{ open: boolean; row: Industry | null }>({
    open: false,
    row: null,
  });
  const [deleting, setDeleting] = React.useState<Industry | null>(null);
  const reorder = useAction(reorderIndustries);
  const toggle = useAction(toggleIndustry);
  const remove = useAction(deleteIndustry);

  const nextOrder = rows.reduce((m, r) => Math.max(m, r.display_order), 0) + 1;
  const deletingCount = deleting ? (counts[deleting.id] ?? 0) : 0;

  return (
    <>
      <AdminPageHeader
        title="Industries"
        count={rows.length}
        description="Sectors you have shipped in. Drag to set the order shown on the home page."
        actions={
          <Button size="sm" onClick={() => setDrawer({ open: true, row: null })}>
            <Plus className="h-3.5 w-3.5" /> Add industry
          </Button>
        }
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No industries yet"
          description="Add the sectors your projects belong to: Fintech, Healthcare, HRMS, E-commerce…"
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDrawer({ open: true, row: null })}
            >
              <Plus className="h-3.5 w-3.5" /> Add industry
            </Button>
          }
        />
      ) : (
        <>
          <div className="mb-2 hidden grid-cols-[auto_1fr_160px_90px_90px] items-center gap-3 px-3 font-mono text-[10px] tracking-wider text-fg-500 uppercase md:grid">
            <span className="w-14" />
            <span>Industry</span>
            <span>Projects</span>
            <span>Visible</span>
            <span className="sr-only">Actions</span>
          </div>
          <SortableList
            items={rows}
            disabled={reorder.pending}
            onReorder={(ids, next) => {
              setRows(next);
              void reorder.run([ids], { onSuccess: () => router.refresh() });
            }}
            renderItem={(row, handle, index) => {
              const auto = counts[row.id] ?? 0;
              const override = row.project_count;
              return (
                <>
                  {handle}
                  <span className="w-6 font-mono text-[11px] text-fg-500">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <div className="grid min-w-0 flex-1 items-center gap-3 md:grid-cols-[1fr_160px_90px_90px]">
                    <div className="min-w-0">
                      <p
                        className={cn(
                          "truncate text-sm font-medium",
                          row.is_visible ? "text-fg-50" : "text-fg-500",
                        )}
                      >
                        {row.name}
                        {row.icon ? (
                          <span className="ml-2 font-mono text-[11px] text-fg-500">{row.icon}</span>
                        ) : null}
                      </p>
                      <p className="truncate font-mono text-[11px] text-fg-500">/{row.slug}</p>
                    </div>
                    <div className="font-mono text-[12px] tabular-nums">
                      {override === null ? (
                        <span className="text-fg-100">
                          {auto} <span className="text-fg-500">auto</span>
                        </span>
                      ) : (
                        <span className="text-fg-100" title={`Automatic count: ${auto}`}>
                          {override} <span className="text-amber-300">override</span>
                          {override !== auto ? (
                            <span className="text-fg-700"> · auto {auto}</span>
                          ) : null}
                        </span>
                      )}
                    </div>
                    <div>
                      <Switch
                        checked={row.is_visible}
                        aria-label={`${row.name} visible`}
                        disabled={toggle.pending}
                        onCheckedChange={(v) => {
                          setRows((prev) =>
                            prev.map((r) => (r.id === row.id ? { ...r, is_visible: v } : r)),
                          );
                          void toggle.run([row.id, v], {
                            silent: true,
                            onSuccess: () => router.refresh(),
                          });
                        }}
                      />
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        aria-label={`Edit ${row.name}`}
                        onClick={() => setDrawer({ open: true, row })}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-fg-500 hover:text-crimson-400"
                        aria-label={`Delete ${row.name}`}
                        onClick={() => setDeleting(row)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </>
              );
            }}
          />
        </>
      )}

      <IndustryDrawer
        open={drawer.open}
        industry={drawer.row}
        autoCount={drawer.row ? (counts[drawer.row.id] ?? 0) : 0}
        nextOrder={nextOrder}
        onOpenChange={(open) => setDrawer((d) => ({ ...d, open }))}
        onSaved={(row, mode) => {
          setRows((prev) =>
            mode === "create" ? [...prev, row] : prev.map((r) => (r.id === row.id ? row : r)),
          );
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name ?? ""}”?`}
        description={
          deletingCount > 0
            ? `${deletingCount} project${deletingCount === 1 ? "" : "s"} reference this industry. They keep working but lose the industry tag.`
            : "No projects reference this industry."
        }
        confirmLabel="Delete industry"
        loading={remove.pending}
        onConfirm={async () => {
          if (!deleting) return;
          const id = deleting.id;
          await remove.run([id], {
            onSuccess: () => {
              setRows((prev) => prev.filter((r) => r.id !== id));
              setDeleting(null);
              router.refresh();
            },
          });
        }}
      />
    </>
  );
}
