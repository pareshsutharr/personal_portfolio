"use client";

import { Milestone, Plus } from "lucide-react";
import { EntityList } from "@/components/admin/crud/entity-list";
import { useEntityCrud } from "@/components/admin/crud/use-entity-crud";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import {
  createSkillMilestone,
  deleteSkillMilestone,
  reorderSkillMilestones,
  toggleSkillMilestone,
  updateSkillMilestone,
} from "@/lib/actions/skill-milestones";
import type { SkillMilestone } from "@/types";
import { MilestoneDrawer } from "./milestone-form";

export function MilestoneManager({ items }: { items: SkillMilestone[] }) {
  const crud = useEntityCrud<SkillMilestone>({
    create: createSkillMilestone,
    update: updateSkillMilestone,
    remove: deleteSkillMilestone,
    reorder: reorderSkillMilestones,
    toggle: toggleSkillMilestone,
  });

  return (
    <Panel>
      <PanelHeader
        title={
          <span className="flex items-center gap-2">
            Skill milestones
            <span className="rounded-xs border border-line-700 bg-surface-700 px-1.5 py-0.5 font-mono text-[11px] font-normal text-fg-300">
              {items.length}
            </span>
          </span>
        }
        description="Phases of growth, oldest first. Dates come from the period label — never guessed."
        actions={
          <Button size="sm" variant="secondary" onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> Add milestone
          </Button>
        }
      />
      <PanelBody>
        <EntityList
          items={items}
          renderRow={(m) => ({
            title: m.title,
            subtitle: m.technologies.length ? m.technologies.join(", ") : null,
            meta: m.period_label,
            badges: (
              <>
                {m.start_year != null ? (
                  <Badge mono>
                    {m.start_year}
                    {m.end_year == null
                      ? " → now"
                      : m.end_year !== m.start_year
                        ? ` → ${m.end_year}`
                        : ""}
                  </Badge>
                ) : null}
              </>
            ),
          })}
          onEdit={crud.openEdit}
          onDelete={crud.remove}
          onToggle={crud.toggle}
          onReorder={crud.reorder}
          emptyState={{
            icon: Milestone,
            title: "No milestones yet",
            description: "Add the phases that shaped your skill set.",
            action: (
              <Button variant="secondary" size="sm" onClick={crud.openCreate}>
                <Plus className="h-4 w-4" /> Add milestone
              </Button>
            ),
          }}
        />
      </PanelBody>

      {crud.open ? (
        <MilestoneDrawer
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
