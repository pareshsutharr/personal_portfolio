"use client";

import { ArrowRight, Plus, Route as RouteIcon } from "lucide-react";
import { EntityList } from "@/components/admin/crud/entity-list";
import { useEntityCrud } from "@/components/admin/crud/use-entity-crud";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  createCareerMapStep,
  deleteCareerMapStep,
  reorderCareerMapSteps,
  toggleCareerMapStep,
  updateCareerMapStep,
} from "@/lib/actions/career-map";
import { cn } from "@/lib/utils/cn";
import type { CareerMapStep } from "@/types";
import { CareerMapDrawer } from "./career-map-form";

export function CareerMapManager({ items }: { items: CareerMapStep[] }) {
  const crud = useEntityCrud<CareerMapStep>({
    create: createCareerMapStep,
    update: updateCareerMapStep,
    remove: deleteCareerMapStep,
    reorder: reorderCareerMapSteps,
    toggle: toggleCareerMapStep,
  });

  return (
    <Panel>
      <PanelHeader
        title={
          <span className="flex items-center gap-2">
            Career map
            <span className="rounded-xs border border-line-700 bg-surface-700 px-1.5 py-0.5 font-mono text-[11px] font-normal text-fg-300">
              {items.length}
            </span>
          </span>
        }
        description="The horizontal chain shown under the skill timeline."
        actions={
          <Button size="sm" variant="secondary" onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> Add step
          </Button>
        }
      />
      <PanelBody className="space-y-4">
        {items.length > 0 ? (
          <div
            className="flex scrollbar-thin items-center gap-2 overflow-x-auto rounded-sm border border-line-800 bg-bg-900 px-4 py-3"
            aria-label="Career map preview"
          >
            {items.map((s, i) => (
              <span key={s.id} className="flex shrink-0 items-center gap-2">
                {i > 0 ? <ArrowRight className="h-3 w-3 text-fg-700" aria-hidden /> : null}
                <span
                  className={cn(
                    "font-mono text-[11px] tracking-[0.14em] uppercase",
                    s.is_visible ? "text-fg-100" : "text-fg-700 line-through",
                  )}
                >
                  {s.label}
                </span>
              </span>
            ))}
          </div>
        ) : null}

        <EntityList
          items={items}
          renderRow={(s, index) => ({
            title: s.label,
            subtitle: s.description,
            meta: String(index + 1).padStart(2, "0"),
          })}
          onEdit={crud.openEdit}
          onDelete={crud.remove}
          onToggle={crud.toggle}
          onReorder={crud.reorder}
          emptyState={{
            icon: RouteIcon,
            title: "No steps yet",
            description: "Add steps like Learning → Development → Architecture.",
            action: (
              <Button variant="secondary" size="sm" onClick={crud.openCreate}>
                <Plus className="h-4 w-4" /> Add step
              </Button>
            ),
          }}
        />
      </PanelBody>

      {crud.open ? (
        <CareerMapDrawer
          key={crud.editing?.id ?? "new"}
          open={crud.open}
          onOpenChange={crud.setOpen}
          entity={crud.editing}
          nextOrder={items.length + 1}
          onSubmit={crud.submit}
          saving={crud.saving}
          fieldErrors={crud.fieldErrors}
        />
      ) : null}
    </Panel>
  );
}
