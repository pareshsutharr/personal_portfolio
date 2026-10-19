"use client";

import { Briefcase, Building2, Plus } from "lucide-react";
import { EntityList, EntityThumb } from "@/components/admin/crud/entity-list";
import { useEntityCrud } from "@/components/admin/crud/use-entity-crud";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createExperience,
  deleteExperience,
  reorderExperiences,
  toggleExperience,
  updateExperience,
} from "@/lib/actions/experiences";
import { formatPeriod } from "@/lib/utils/format";
import { EMPLOYMENT_TYPE_LABELS, type Experience } from "@/types";
import { ExperienceDrawer } from "./experience-form";

export function ExperienceManager({
  items,
  initialOpen = false,
}: {
  items: Experience[];
  initialOpen?: boolean;
}) {
  const crud = useEntityCrud<Experience>(
    {
      create: createExperience,
      update: updateExperience,
      remove: deleteExperience,
      reorder: reorderExperiences,
      toggle: toggleExperience,
    },
    { initialOpen },
  );

  return (
    <>
      <AdminPageHeader
        title="Experience"
        description="Roles shown on the public timeline, in this order."
        count={items.length}
        actions={
          <Button onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> Add experience
          </Button>
        }
      />

      <EntityList
        items={items}
        searchable
        searchPlaceholder="Search by position or company…"
        renderRow={(e) => ({
          title: e.position,
          subtitle: [e.company, e.location].filter(Boolean).join(" · "),
          meta:
            formatPeriod({
              periodLabel: e.period_label,
              startDate: e.start_date,
              endDate: e.end_date,
              isCurrent: e.is_current,
            }) ?? "No period",
          badges: (
            <>
              <Badge mono>{EMPLOYMENT_TYPE_LABELS[e.employment_type]}</Badge>
              {e.is_current ? <Badge tone="ember">Current</Badge> : null}
            </>
          ),
          leading: (
            <EntityThumb
              src={e.logo}
              alt={`${e.company} logo`}
              fallback={<Building2 className="h-4 w-4" />}
            />
          ),
        })}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        onToggle={crud.toggle}
        onReorder={crud.reorder}
        emptyState={{
          icon: Briefcase,
          title: "No experience yet",
          description: "Add your roles to build the public timeline.",
          action: (
            <Button variant="secondary" size="sm" onClick={crud.openCreate}>
              <Plus className="h-4 w-4" /> Add experience
            </Button>
          ),
        }}
      />

      {crud.open ? (
        <ExperienceDrawer
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
    </>
  );
}
