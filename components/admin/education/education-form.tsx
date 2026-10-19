"use client";

import { EntityDrawer } from "@/components/admin/crud/entity-drawer";
import { useFormValues } from "@/components/admin/crud/use-form-values";
import { ImageField } from "@/components/admin/image-field";
import { Field, Label } from "@/components/ui/field";
import { Input, Switch, Textarea } from "@/components/ui/input";
import type { Education } from "@/types";

export type EducationFormValues = {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date: string;
  period_label: string;
  grade: string;
  description: string;
  logo: string;
  display_order: number;
  is_visible: boolean;
};

function toValues(e: Education | null, nextOrder: number): EducationFormValues {
  return {
    institution: e?.institution ?? "",
    degree: e?.degree ?? "",
    field: e?.field ?? "",
    start_date: e?.start_date ?? "",
    end_date: e?.end_date ?? "",
    period_label: e?.period_label ?? "",
    grade: e?.grade ?? "",
    description: e?.description ?? "",
    logo: e?.logo ?? "",
    display_order: e?.display_order ?? nextOrder,
    is_visible: e?.is_visible ?? true,
  };
}

export function EducationDrawer({
  open,
  onOpenChange,
  entity,
  nextOrder,
  onSubmit,
  saving,
  fieldErrors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Education | null;
  nextOrder: number;
  onSubmit: (values: EducationFormValues) => Promise<void>;
  saving: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const { values, set } = useFormValues(toValues(entity, nextOrder));

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={entity ? "Edit education" : "Add education"}
      description={entity ? entity.institution : "A degree or course on your timeline."}
      onSubmit={() => onSubmit(values)}
      saving={saving}
      fieldErrors={fieldErrors}
      submitLabel={entity ? "Save changes" : "Create"}
    >
      <Field label="Institution" htmlFor="institution" required errors={fieldErrors.institution}>
        <Input
          id="institution"
          value={values.institution}
          onChange={(e) => set("institution", e.target.value)}
          autoFocus
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Degree" htmlFor="degree" required errors={fieldErrors.degree}>
          <Input
            id="degree"
            value={values.degree}
            onChange={(e) => set("degree", e.target.value)}
            placeholder="B.E., MCA, Diploma"
          />
        </Field>
        <Field label="Field of study" htmlFor="field" errors={fieldErrors.field}>
          <Input
            id="field"
            value={values.field}
            onChange={(e) => set("field", e.target.value)}
            placeholder="Computer Engineering"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start date" htmlFor="start_date" errors={fieldErrors.start_date}>
          <Input
            id="start_date"
            type="date"
            value={values.start_date}
            onChange={(e) => set("start_date", e.target.value)}
          />
        </Field>
        <Field label="End date" htmlFor="end_date" errors={fieldErrors.end_date}>
          <Input
            id="end_date"
            type="date"
            value={values.end_date}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </Field>
      </div>

      <Field
        label="Period label"
        htmlFor="period_label"
        errors={fieldErrors.period_label}
        hint="Overrides the dates shown publicly, e.g. '2019 — 2023'. Leave empty to show dates. Nothing is shown if both are empty — never invent dates."
      >
        <Input
          id="period_label"
          value={values.period_label}
          onChange={(e) => set("period_label", e.target.value)}
        />
      </Field>

      <Field
        label="Grade"
        htmlFor="grade"
        errors={fieldErrors.grade}
        hint="Optional. Only the real result, e.g. '8.2 CGPA' or 'First class'."
      >
        <Input id="grade" value={values.grade} onChange={(e) => set("grade", e.target.value)} />
      </Field>

      <Field label="Description" htmlFor="description" errors={fieldErrors.description}>
        <Textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <div className="max-w-[200px]">
        <ImageField
          label="Logo"
          value={values.logo}
          onChange={(url) => set("logo", url ?? "")}
          folder="logos"
          aspect="square"
          errors={fieldErrors.logo}
        />
      </div>

      <div className="flex items-center justify-between gap-4 border-t border-line-800 pt-4">
        <div>
          <Label htmlFor="is_visible">Visible</Label>
          <p className="mt-0.5 text-xs text-fg-500">Hidden entries stay in admin only.</p>
        </div>
        <Switch
          id="is_visible"
          checked={values.is_visible}
          onCheckedChange={(v) => set("is_visible", v)}
        />
      </div>
    </EntityDrawer>
  );
}
