"use client";

import { EntityDrawer } from "@/components/admin/crud/entity-drawer";
import { useFormValues } from "@/components/admin/crud/use-form-values";
import { ImageField } from "@/components/admin/image-field";
import { Field, Label } from "@/components/ui/field";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { EMPLOYMENT_TYPE_LABELS, type EmploymentType, type Experience } from "@/types";

export type ExperienceFormValues = {
  company: string;
  position: string;
  employment_type: EmploymentType;
  location: string;
  start_date: string;
  end_date: string;
  period_label: string;
  is_current: boolean;
  description: string;
  responsibilities: string;
  technologies: string;
  achievements: string;
  company_url: string;
  logo: string;
  display_order: number;
  is_visible: boolean;
};

function toValues(e: Experience | null, nextOrder: number): ExperienceFormValues {
  return {
    company: e?.company ?? "",
    position: e?.position ?? "",
    employment_type: e?.employment_type ?? "full_time",
    location: e?.location ?? "",
    start_date: e?.start_date ?? "",
    end_date: e?.end_date ?? "",
    period_label: e?.period_label ?? "",
    is_current: e?.is_current ?? false,
    description: e?.description ?? "",
    responsibilities: e?.responsibilities.join("\n") ?? "",
    technologies: e?.technologies.join(", ") ?? "",
    achievements: e?.achievements.join("\n") ?? "",
    company_url: e?.company_url ?? "",
    logo: e?.logo ?? "",
    display_order: e?.display_order ?? nextOrder,
    is_visible: e?.is_visible ?? true,
  };
}

export function ExperienceDrawer({
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
  entity: Experience | null;
  nextOrder: number;
  onSubmit: (values: ExperienceFormValues) => Promise<void>;
  saving: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const { values, set } = useFormValues(toValues(entity, nextOrder));

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={entity ? "Edit experience" : "Add experience"}
      description={entity ? `${entity.position} · ${entity.company}` : "A role on your timeline."}
      onSubmit={() => onSubmit(values)}
      saving={saving}
      fieldErrors={fieldErrors}
      submitLabel={entity ? "Save changes" : "Create"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Position" htmlFor="position" required errors={fieldErrors.position}>
          <Input
            id="position"
            value={values.position}
            onChange={(e) => set("position", e.target.value)}
            placeholder="Full-stack developer"
            autoFocus
          />
        </Field>
        <Field label="Company" htmlFor="company" required errors={fieldErrors.company}>
          <Input
            id="company"
            value={values.company}
            onChange={(e) => set("company", e.target.value)}
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Employment type"
          htmlFor="employment_type"
          errors={fieldErrors.employment_type}
        >
          <Select
            id="employment_type"
            value={values.employment_type}
            onChange={(e) => set("employment_type", e.target.value as EmploymentType)}
          >
            {(Object.keys(EMPLOYMENT_TYPE_LABELS) as EmploymentType[]).map((k) => (
              <option key={k} value={k}>
                {EMPLOYMENT_TYPE_LABELS[k]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Location" htmlFor="location" errors={fieldErrors.location}>
          <Input
            id="location"
            value={values.location}
            onChange={(e) => set("location", e.target.value)}
            placeholder="Ahmedabad, India · Remote"
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
        <Field
          label="End date"
          htmlFor="end_date"
          errors={fieldErrors.end_date}
          hint={values.is_current ? "Disabled while this is your current role." : undefined}
        >
          <Input
            id="end_date"
            type="date"
            value={values.end_date}
            disabled={values.is_current}
            onChange={(e) => set("end_date", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <Label htmlFor="is_current">Current role</Label>
          <p className="mt-0.5 text-xs text-fg-500">Shows “Present” instead of an end date.</p>
        </div>
        <Switch
          id="is_current"
          checked={values.is_current}
          onCheckedChange={(v) => {
            set("is_current", v);
            if (v) set("end_date", "");
          }}
        />
      </div>

      <Field
        label="Period label"
        htmlFor="period_label"
        errors={fieldErrors.period_label}
        hint="Overrides the dates shown publicly, e.g. '2024 — Present'. Leave empty to show dates. Nothing is shown if both are empty — never invent dates."
      >
        <Input
          id="period_label"
          value={values.period_label}
          onChange={(e) => set("period_label", e.target.value)}
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

      <Field
        label="Responsibilities"
        htmlFor="responsibilities"
        errors={fieldErrors.responsibilities}
        hint="One per line."
      >
        <Textarea
          id="responsibilities"
          rows={4}
          value={values.responsibilities}
          onChange={(e) => set("responsibilities", e.target.value)}
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
          placeholder="Next.js, Supabase, Flutter"
        />
      </Field>

      <Field
        label="Achievements"
        htmlFor="achievements"
        errors={fieldErrors.achievements}
        hint="One per line. Only real, verifiable achievements."
      >
        <Textarea
          id="achievements"
          rows={3}
          value={values.achievements}
          onChange={(e) => set("achievements", e.target.value)}
        />
      </Field>

      <Field label="Company URL" htmlFor="company_url" errors={fieldErrors.company_url}>
        <Input
          id="company_url"
          type="url"
          inputMode="url"
          value={values.company_url}
          onChange={(e) => set("company_url", e.target.value)}
          placeholder="https://"
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
