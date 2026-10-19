"use client";

import * as React from "react";
import {
  SelectField,
  SwitchField,
  TextField,
  TextareaField,
  useFormValues,
} from "@/components/admin/forms/form-kit";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { useAction } from "@/hooks/use-action";
import { createStat, updateStat } from "@/lib/actions/stats";
import type { Stat } from "@/types";

export const AUTO_SOURCES = [
  { value: "manual", label: "Manual" },
  { value: "projects_count", label: "Projects count" },
  { value: "technologies_count", label: "Technologies count" },
  { value: "industries_count", label: "Industries count" },
] as const;

export type AutoSource = (typeof AUTO_SOURCES)[number]["value"];
export type ComputedSource = Exclude<AutoSource, "manual">;
/** Live counts computed server-side on the stats page. */
export type ComputedCounts = Record<ComputedSource, number>;

export function isAutoSource(value: string): value is AutoSource {
  return AUTO_SOURCES.some((s) => s.value === value);
}

export function autoSourceLabel(value: string) {
  return AUTO_SOURCES.find((s) => s.value === value)?.label ?? value;
}

type StatFormValues = {
  label: string;
  value: string;
  auto_source: AutoSource;
  description: string;
  is_visible: boolean;
};

function toValues(stat: Stat | null): StatFormValues {
  return {
    label: stat?.label ?? "",
    value: stat?.value ?? "",
    auto_source: stat && isAutoSource(stat.auto_source) ? stat.auto_source : "manual",
    description: stat?.description ?? "",
    is_visible: stat?.is_visible ?? true,
  };
}

const FORM_ID = "stat-form";

export function StatDrawer({
  open,
  onOpenChange,
  stat,
  nextOrder,
  computed,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create */
  stat: Stat | null;
  nextOrder: number;
  computed: ComputedCounts;
  onSaved: (stat: Stat) => void;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={stat ? "Edit stat" : "Add stat"}
      description="Headline numbers on the home and about pages. Never invent a figure."
      footer={
        <>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <SubmitButton formId={FORM_ID} />
        </>
      }
    >
      {open ? (
        <StatForm
          key={stat?.id ?? "new"}
          stat={stat}
          nextOrder={nextOrder}
          computed={computed}
          onSaved={onSaved}
        />
      ) : null}
    </Drawer>
  );
}

function SubmitButton({ formId }: { formId: string }) {
  const [pending, setPending] = React.useState(false);
  React.useEffect(() => {
    const form = document.getElementById(formId);
    if (!form) return;
    const observer = new MutationObserver(() => {
      setPending(form.getAttribute("data-pending") === "true");
    });
    observer.observe(form, { attributes: true, attributeFilter: ["data-pending"] });
    return () => observer.disconnect();
  }, [formId]);
  return (
    <Button type="submit" form={formId} loading={pending}>
      Save stat
    </Button>
  );
}

function StatForm({
  stat,
  nextOrder,
  computed,
  onSaved,
}: {
  stat: Stat | null;
  nextOrder: number;
  computed: ComputedCounts;
  onSaved: (stat: Stat) => void;
}) {
  const { values, set } = useFormValues(toValues(stat));
  const create = useAction(createStat);
  const update = useAction(updateStat);
  const pending = stat ? update.pending : create.pending;
  const fieldErrors = stat ? update.fieldErrors : create.fieldErrors;

  const isAuto = values.auto_source !== "manual";
  const computedValue = isAuto ? computed[values.auto_source as ComputedSource] : null;

  const onAutoSourceChange = (source: AutoSource) => {
    set("auto_source", source);
    // Keep the stored value in sync so the DB never holds a stale figure.
    if (source !== "manual") set("value", String(computed[source]));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...values,
      value: isAuto ? String(computedValue ?? 0) : values.value,
      display_order: stat ? stat.display_order : nextOrder,
    };
    if (stat) await update.run([stat.id, payload], { onSuccess: onSaved });
    else await create.run([payload], { onSuccess: onSaved });
  };

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate data-pending={pending} className="space-y-5">
      <TextField
        id="label"
        label="Label"
        required
        value={values.label}
        onChange={(v) => set("label", v)}
        errors={fieldErrors.label}
        placeholder="Projects shipped"
      />

      <SelectField
        id="auto_source"
        label="Source"
        value={values.auto_source}
        onChange={onAutoSourceChange}
        options={AUTO_SOURCES}
        errors={fieldErrors.auto_source}
        hint="Automatic sources recount on every page build, so the number never goes stale."
      />

      <TextField
        id="value"
        label="Value"
        required
        value={isAuto ? String(computedValue ?? 0) : values.value}
        onChange={(v) => set("value", v)}
        errors={fieldErrors.value}
        disabled={isAuto}
        hint={
          isAuto
            ? `Computed right now: ${computedValue ?? 0} (${autoSourceLabel(values.auto_source).toLowerCase()}).`
            : 'Short. "12", "3+", "99.9%" all work.'
        }
        placeholder="12"
        mono
        className="sm:max-w-xs"
      />

      <TextareaField
        id="description"
        label="Description"
        rows={2}
        max={120}
        value={values.description}
        onChange={(v) => set("description", v)}
        errors={fieldErrors.description}
        hint="Optional one-liner under the number."
      />

      <SwitchField
        id="is_visible"
        label="Visible"
        description="Hidden stats stay here but never render publicly."
        checked={values.is_visible}
        onCheckedChange={(v) => set("is_visible", v)}
        errors={fieldErrors.is_visible}
      />
    </form>
  );
}
