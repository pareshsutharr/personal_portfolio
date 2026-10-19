"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Cpu, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select } from "@/components/ui/input";
import { TBody, TD, TH, THead, TR, Table } from "@/components/ui/table";
import { useAction } from "@/hooks/use-action";
import { deleteTechnology } from "@/lib/actions/technologies";
import { SKILL_CATEGORIES } from "@/lib/validation/schemas";
import { SKILL_CATEGORY_LABELS, type SkillCategory, type Technology } from "@/types";
import { TechnologyDrawer } from "./technology-drawer";

export function TechnologiesAdmin({
  technologies: initial,
  usage,
}: {
  technologies: Technology[];
  usage: Record<string, number>;
}) {
  const router = useRouter();
  const [rows, setRows] = React.useState(initial);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState<"all" | SkillCategory>("all");
  const [drawer, setDrawer] = React.useState<{ open: boolean; row: Technology | null }>({
    open: false,
    row: null,
  });
  const [deleting, setDeleting] = React.useState<Technology | null>(null);
  const remove = useAction(deleteTechnology);

  const q = query.trim().toLowerCase();
  const visible = rows.filter(
    (t) =>
      (category === "all" || t.category === category) &&
      (!q || t.name.toLowerCase().includes(q) || t.slug.includes(q)),
  );

  const grouped = React.useMemo(() => {
    const map = new Map<SkillCategory, Technology[]>();
    for (const t of visible) {
      const list = map.get(t.category) ?? [];
      list.push(t);
      map.set(t.category, list);
    }
    return SKILL_CATEGORIES.filter((c) => map.has(c)).map((c) => [c, map.get(c)!] as const);
  }, [visible]);

  const filtersActive = q !== "" || category !== "all";
  const deletingUsage = deleting ? (usage[deleting.id] ?? 0) : 0;

  return (
    <>
      <AdminPageHeader
        title="Technologies"
        count={rows.length}
        description="The shared vocabulary for project stacks and the skills page."
        actions={
          <Button size="sm" onClick={() => setDrawer({ open: true, row: null })}>
            <Plus className="h-3.5 w-3.5" /> Add technology
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-fg-500"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search technologies…"
            aria-label="Search technologies"
            className="h-9 w-64 pl-8 text-[13px]"
          />
        </div>
        <div className="w-48">
          <Select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value as "all" | SkillCategory)}
            className="h-9 text-[13px]"
          >
            <option value="all">All categories</option>
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SKILL_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </div>
        {filtersActive ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-9"
            onClick={() => {
              setQuery("");
              setCategory("all");
            }}
          >
            Clear
          </Button>
        ) : null}
        <span className="ml-auto font-mono text-[11px] text-fg-500">
          {visible.length} of {rows.length}
        </span>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Cpu}
          title="No technologies yet"
          description="Add the languages, frameworks and tools you use. Projects reference them for their stack."
          action={
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setDrawer({ open: true, row: null })}
            >
              <Plus className="h-3.5 w-3.5" /> Add technology
            </Button>
          }
        />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="Try a different search or category."
        />
      ) : (
        <Table>
          <THead>
            <tr>
              <TH>Name</TH>
              <TH>Slug</TH>
              <TH>Category</TH>
              <TH className="text-right">Used by</TH>
              <TH className="w-24">
                <span className="sr-only">Actions</span>
              </TH>
            </tr>
          </THead>
          <TBody>
            {grouped.map(([cat, list]) => (
              <React.Fragment key={cat}>
                {category === "all" ? (
                  <tr className="bg-surface-800/40">
                    <td
                      colSpan={5}
                      className="px-4 py-1.5 font-mono text-[10px] tracking-wider text-fg-500 uppercase"
                    >
                      {SKILL_CATEGORY_LABELS[cat]}{" "}
                      <span className="text-fg-700">· {list.length}</span>
                    </td>
                  </tr>
                ) : null}
                {list.map((t) => {
                  const count = usage[t.id] ?? 0;
                  return (
                    <TR key={t.id}>
                      <TD>
                        <div className="flex items-center gap-2.5">
                          <span
                            aria-hidden
                            className="h-3 w-3 shrink-0 rounded-full border border-line-600 bg-surface-700"
                            style={t.color ? { backgroundColor: t.color } : undefined}
                          />
                          <span className="text-sm font-medium text-fg-50">{t.name}</span>
                          {t.icon ? (
                            <span className="font-mono text-[11px] text-fg-500">{t.icon}</span>
                          ) : null}
                        </div>
                        {t.description ? (
                          <p className="mt-0.5 max-w-md truncate text-xs text-fg-500">
                            {t.description}
                          </p>
                        ) : null}
                      </TD>
                      <TD className="font-mono text-[12px] text-fg-300">{t.slug}</TD>
                      <TD>
                        <Badge tone="neutral" mono>
                          {SKILL_CATEGORY_LABELS[t.category]}
                        </Badge>
                      </TD>
                      <TD className="text-right font-mono text-[12px] tabular-nums">
                        {count > 0 ? (
                          <span className="text-fg-100">
                            {count}{" "}
                            <span className="text-fg-500">project{count === 1 ? "" : "s"}</span>
                          </span>
                        ) : (
                          <span className="text-fg-700">unused</span>
                        )}
                      </TD>
                      <TD>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            aria-label={`Edit ${t.name}`}
                            onClick={() => setDrawer({ open: true, row: t })}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-fg-500 hover:text-crimson-400"
                            aria-label={`Delete ${t.name}`}
                            onClick={() => setDeleting(t)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  );
                })}
              </React.Fragment>
            ))}
          </TBody>
        </Table>
      )}

      <TechnologyDrawer
        open={drawer.open}
        technology={drawer.row}
        onOpenChange={(open) => setDrawer((d) => ({ ...d, open }))}
        onSaved={(row, mode) => {
          setRows((prev) =>
            mode === "create" ? [...prev, row] : prev.map((t) => (t.id === row.id ? row : t)),
          );
          router.refresh();
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.name ?? ""}”?`}
        description={
          deletingUsage > 0
            ? `Used by ${deletingUsage} project${deletingUsage === 1 ? "" : "s"}. It will be removed from their stacks.`
            : "This technology is not used by any project."
        }
        confirmLabel={deletingUsage > 0 ? `Delete anyway` : "Delete"}
        loading={remove.pending}
        onConfirm={async () => {
          if (!deleting) return;
          const id = deleting.id;
          await remove.run([id], {
            onSuccess: () => {
              setRows((prev) => prev.filter((t) => t.id !== id));
              setDeleting(null);
              router.refresh();
            },
          });
        }}
      />
    </>
  );
}
