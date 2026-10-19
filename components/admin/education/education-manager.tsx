"use client";

import { GraduationCap, Plus } from "lucide-react";
import { EntityList, EntityThumb } from "@/components/admin/crud/entity-list";
import { useEntityCrud } from "@/components/admin/crud/use-entity-crud";
import { AdminPageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  createEducation,
  deleteEducation,
  reorderEducation,
  toggleEducation,
  updateEducation,
} from "@/lib/actions/education";
import { formatPeriod } from "@/lib/utils/format";
import type { Education } from "@/types";
import { EducationDrawer } from "./education-form";

export function EducationManager({
  items,
  initialOpen = false,
}: {
  items: Education[];
  initialOpen?: boolean;
}) {
  const crud = useEntityCrud<Education>(
    {
      create: createEducation,
      update: updateEducation,
      remove: deleteEducation,
      reorder: reorderEducation,
      toggle: toggleEducation,
    },
    { initialOpen },
  );

  return (
    <>
      <AdminPageHeader
        title="Education"
        description="Degrees and courses shown on the public timeline."
        count={items.length}
        actions={
          <Button onClick={crud.openCreate}>
            <Plus className="h-4 w-4" /> Add education
          </Button>
        }
      />

      <EntityList
        items={items}
        searchable
        searchPlaceholder="Search by degree or institution…"
        renderRow={(e) => ({
          title: [e.degree, e.field].filter(Boolean).join(" · "),
          subtitle: e.institution,
          meta:
            formatPeriod({
              periodLabel: e.period_label,
              startDate: e.start_date,
              endDate: e.end_date,
            }) ?? "No period",
          badges: e.grade ? <Badge mono>{e.grade}</Badge> : null,
          leading: (
            <EntityThumb
              src={e.logo}
              alt={`${e.institution} logo`}
              fallback={<GraduationCap className="h-4 w-4" />}
            />
          ),
        })}
        onEdit={crud.openEdit}
        onDelete={crud.remove}
        onToggle={crud.toggle}
        onReorder={crud.reorder}
        emptyState={{
          icon: GraduationCap,
          title: "No education yet",
          description: "Add degrees and courses to show them on the timeline.",
          action: (
            <Button variant="secondary" size="sm" onClick={crud.openCreate}>
              <Plus className="h-4 w-4" /> Add education
            </Button>
          ),
        }}
      />

      {crud.open ? (
        <EducationDrawer
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
