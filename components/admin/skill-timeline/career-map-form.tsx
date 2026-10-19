"use client";

import { EntityDrawer } from "@/components/admin/crud/entity-drawer";
import { useFormValues } from "@/components/admin/crud/use-form-values";
import { Field, Label } from "@/components/ui/field";
import { Input, Switch, Textarea } from "@/components/ui/input";
import type { CareerMapStep } from "@/types";

export type CareerMapFormValues = {
  label: string;
  description: string;
  display_order: number;
  is_visible: boolean;
};

function toValues(s: CareerMapStep | null, nextOrder: number): CareerMapFormValues {
  return {
    label: s?.label ?? "",
    description: s?.description ?? "",
    display_order: s?.display_order ?? nextOrder,
    is_visible: s?.is_visible ?? true,
  };
}

export function CareerMapDrawer({
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
  entity: CareerMapStep | null;
  nextOrder: number;
  onSubmit: (values: CareerMapFormValues) => Promise<void>;
  saving: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const { values, set } = useFormValues(toValues(entity, nextOrder));

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={entity ? "Edit step" : "Add step"}
      description={entity ? entity.label : "One stage in the career map chain."}
      onSubmit={() => onSubmit(values)}
      saving={saving}
      fieldErrors={fieldErrors}
      submitLabel={entity ? "Save changes" : "Create"}
    >
      <Field
        label="Label"
        htmlFor="label"
        required
        errors={fieldErrors.label}
        hint="Short, one or two words. Shown uppercase in the chain, e.g. 'Learning', 'Development'."
      >
        <Input
          id="label"
          value={values.label}
          onChange={(e) => set("label", e.target.value)}
          maxLength={60}
          autoFocus
        />
      </Field>

      <Field label="Description" htmlFor="description" errors={fieldErrors.description}>
        <Textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <div className="flex items-center justify-between gap-4 border-t border-line-800 pt-4">
        <div>
          <Label htmlFor="is_visible">Visible</Label>
          <p className="mt-0.5 text-xs text-fg-500">Hidden steps are skipped in the chain.</p>
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
