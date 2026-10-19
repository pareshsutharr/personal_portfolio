"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChartColumn, Pencil, Plus, RefreshCw, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { SortableList } from "@/components/admin/sortable-list";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Switch } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { deleteStat, reorderStats, toggleStat } from "@/lib/actions/stats";
import { cn } from "@/lib/utils/cn";
import type { Stat } from "@/types";
import { StatDrawer, autoSourceLabel, type ComputedCounts, type ComputedSource } from "./stat-form";

type DrawerState = { mode: "create" } | { mode: "edit"; stat: Stat } | null;

export function StatsManager({
  initialStats,
  computed,
}: {
  initialStats: Stat[];
  computed: ComputedCounts;
}) {
  const router = useRouter();
  const [stats, setStats] = React.useState(initialStats);
  const [drawer, setDrawer] = React.useState<DrawerState>(null);
  const [deleting, setDeleting] = React.useState<Stat | null>(null);

  const reorder = useAction(reorderStats);
  const toggle = useAction(toggleStat);
  const remove = useAction(deleteStat);

  const visibleCount = stats.filter((s) => s.is_visible).length;

  const handleReorder = async (ids: string[], next: Stat[]) => {
    const previous = stats;
    setStats(next);
    const res = await reorder.run([ids], { silent: true });
    if (!res?.ok) setStats(previous);
    else router.refresh();
  };

  const handleToggle = async (stat: Stat, value: boolean) => {
    const previous = stats;
    setStats((cur) => cur.map((s) => (s.id === stat.id ? { ...s, is_visible: value } : s)));
    const res = await toggle.run([stat.id, "is_visible", value]);
    if (!res?.ok) setStats(previous);
    else router.refresh();
  };

  const handleSaved = (saved: Stat) => {
    setStats((cur) => {
      const exists = cur.some((s) => s.id === saved.id);
      return exists ? cur.map((s) => (s.id === saved.id ? saved : s)) : [...cur, saved];
    });
    setDrawer(null);
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleting) return;
    const id = deleting.id;
    await remove.run([id], {
      onSuccess: () => {
        setStats((cur) => cur.filter((s) => s.id !== id));
        setDeleting(null);
        router.refresh();
      },
    });
  };

  const resolvedValue = (stat: Stat) =>
    stat.auto_source !== "manual" && stat.auto_source in computed
      ? String(computed[stat.auto_source as ComputedSource])
      : stat.value;

  return (
    <>
      <AdminPageHeader
        title="Stats"
        count={stats.length}
        description={`${visibleCount} visible. Automatic stats recount live; manual ones show exactly what you type.`}
        actions={
          <Button size="sm" onClick={() => setDrawer({ mode: "create" })}>
            <Plus className="h-4 w-4" /> Add stat
          </Button>
        }
      />

      {stats.length === 0 ? (
        <EmptyState
          icon={ChartColumn}
          title="No stats yet"
          description="Add a few headline numbers. Use automatic sources where possible so they stay honest."
          action={
            <Button size="sm" onClick={() => setDrawer({ mode: "create" })}>
              <Plus className="h-4 w-4" /> Add stat
            </Button>
          }
        />
      ) : (
        <SortableList
          items={stats}
          onReorder={handleReorder}
          disabled={reorder.pending}
          renderItem={(stat, handle) => {
            const auto = stat.auto_source !== "manual";
            return (
              <>
                {handle}
                <span
                  className={cn(
                    "flex h-9 min-w-14 shrink-0 items-center justify-center rounded-sm border border-line-700 bg-surface-800 px-2 font-display text-base font-semibold tabular-nums",
                    stat.is_visible ? "text-fg-50" : "text-fg-500",
                  )}
                >
                  {resolvedValue(stat)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span
                      className={cn(
                        "text-sm font-medium",
                        stat.is_visible ? "text-fg-50" : "text-fg-300",
                      )}
                    >
                      {stat.label}
                    </span>
                    {auto ? (
                      <Badge tone="info">
                        <RefreshCw className="h-3 w-3" /> Auto · {autoSourceLabel(stat.auto_source)}
                      </Badge>
                    ) : (
                      <Badge tone="outline">Manual</Badge>
                    )}
                  </div>
                  {stat.description ? (
                    <p className="truncate text-xs text-fg-500">{stat.description}</p>
                  ) : null}
                </div>
                <Switch
                  checked={stat.is_visible}
                  onCheckedChange={(v) => void handleToggle(stat, v)}
                  aria-label={`${stat.is_visible ? "Hide" : "Show"} ${stat.label}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Edit ${stat.label}`}
                  onClick={() => setDrawer({ mode: "edit", stat })}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={`Delete ${stat.label}`}
                  className="hover:text-crimson-400"
                  onClick={() => setDeleting(stat)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            );
          }}
        />
      )}

      <StatDrawer
        open={drawer !== null}
        onOpenChange={(open) => !open && setDrawer(null)}
        stat={drawer?.mode === "edit" ? drawer.stat : null}
        nextOrder={stats.length + 1}
        computed={computed}
        onSaved={handleSaved}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this stat?"
        description={deleting ? `${deleting.label} · ${resolvedValue(deleting)}` : undefined}
        onConfirm={handleDelete}
        loading={remove.pending}
      />
    </>
  );
}
