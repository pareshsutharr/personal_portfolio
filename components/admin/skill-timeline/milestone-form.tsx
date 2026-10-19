"use client";

import { EntityDrawer } from "@/components/admin/crud/entity-drawer";
import { useFormValues } from "@/components/admin/crud/use-form-values";
import { Field, Label } from "@/components/ui/field";
import { Input, Switch, Textarea } from "@/components/ui/input";
import type { SkillMilestone } from "@/types";

export type MilestoneFormValues = {
  period_label: string;
  title: string;
  description: string;
  start_year: string;
  end_year: string;
  technologies: string;
  display_order: number;
  is_visible: boolean;
};

function toValues(m: SkillMilestone | null, nextOrder: number): MilestoneFormValues {
  return {
    period_label: m?.period_label ?? "",
    title: m?.title ?? "",
    description: m?.description ?? "",
    start_year: m?.start_year == null ? "" : String(m.start_year),
    end_year: m?.end_year == null ? "" : String(m.end_year),
    technologies: m?.technologies.join(", ") ?? "",
    display_order: m?.display_order ?? nextOrder,
    is_visible: m?.is_visible ?? true,
  };
}

export function MilestoneDrawer({
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
  entity: SkillMilestone | null;
  nextOrder: number;
  onSubmit: (values: MilestoneFormValues) => Promise<void>;
  saving: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const { values, set } = useFormValues(toValues(entity, nextOrder));

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={entity ? "Edit milestone" : "Add milestone"}
      description={entity ? entity.title : "A phase in how your skills developed."}
      onSubmit={() => onSubmit(values)}
      saving={saving}
      fieldErrors={fieldErrors}
      submitLabel={entity ? "Save changes" : "Create"}
    >
      <div className="grid gap-4 sm:grid-cols-[140px_1fr]">
        <Field
          label="Period"
          htmlFor="period_label"
          required
          errors={fieldErrors.period_label}
          hint="e.g. '2021 — 2022'."
        >
          <Input
            id="period_label"
            value={values.period_label}
            onChange={(e) => set("period_label", e.target.value)}
            className="font-mono"
            autoFocus
          />
        </Field>
        <Field label="Title" htmlFor="title" required errors={fieldErrors.title}>
          <Input
            id="title"
            value={values.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Moved to full-stack TypeScript"
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Start year" htmlFor="start_year" errors={fieldErrors.start_year}>
          <Input
            id="start_year"
            type="number"
            inputMode="numeric"
            min={1990}
            max={2100}
            value={values.start_year}
            onChange={(e) => set("start_year", e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field
          label="End year"
          htmlFor="end_year"
          errors={fieldErrors.end_year}
          hint="Empty = present."
        >
          <Input
            id="end_year"
            type="number"
            inputMode="numeric"
            min={1990}
            max={2100}
            value={values.end_year}
            onChange={(e) => set("end_year", e.target.value)}
            className="font-mono"
          />
        </Field>
      </div>

      <Field label="Description" htmlFor="description" errors={fieldErrors.description}>
        <Textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <Field
        label="Technologies"
        htmlFor="technologies"
        errors={fieldErrors.technologies}
        hint="Comma separated."
      >
        <Input
          id="technologies"
          value={values.technologies}
          onChange={(e) => set("technologies", e.target.value)}
          placeholder="React, Node.js, PostgreSQL"
        />
      </Field>

      <div className="flex items-center justify-between gap-4 border-t border-line-800 pt-4">
        <div>
          <Label htmlFor="is_visible">Visible</Label>
          <p className="mt-0.5 text-xs text-fg-500">Hidden milestones stay in admin only.</p>
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
