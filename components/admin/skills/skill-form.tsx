"use client";

import { EntityDrawer } from "@/components/admin/crud/entity-drawer";
import { useFormValues } from "@/components/admin/crud/use-form-values";
import { Field, Label } from "@/components/ui/field";
import { Input, Select, Switch, Textarea } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { SKILL_CATEGORY_LABELS, type Skill, type SkillCategory } from "@/types";

export type TechnologyOption = { id: string; name: string };

export type SkillFormValues = {
  name: string;
  category: SkillCategory;
  proficiency: string;
  years: string;
  technology_id: string;
  icon: string;
  color: string;
  description: string;
  display_order: number;
  is_featured: boolean;
  is_visible: boolean;
};

function toValues(s: Skill | null, nextOrder: number): SkillFormValues {
  return {
    name: s?.name ?? "",
    category: s?.category ?? "frontend",
    proficiency: s?.proficiency == null ? "" : String(s.proficiency),
    years: s?.years == null ? "" : String(s.years),
    technology_id: s?.technology_id ?? "",
    icon: s?.icon ?? "",
    color: s?.color ?? "",
    description: s?.description ?? "",
    display_order: s?.display_order ?? nextOrder,
    is_featured: s?.is_featured ?? false,
    is_visible: s?.is_visible ?? true,
  };
}

const LEVELS = ["1", "2", "3", "4", "5"] as const;

export function SkillDrawer({
  open,
  onOpenChange,
  entity,
  nextOrder,
  technologies,
  defaultCategory,
  onSubmit,
  saving,
  fieldErrors,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entity: Skill | null;
  nextOrder: number;
  technologies: TechnologyOption[];
  /** Pre-select the active filter's category for new skills. */
  defaultCategory?: SkillCategory;
  onSubmit: (values: SkillFormValues) => Promise<void>;
  saving: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const { values, set } = useFormValues({
    ...toValues(entity, nextOrder),
    ...(entity || !defaultCategory ? {} : { category: defaultCategory }),
  });

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={entity ? "Edit skill" : "Add skill"}
      description={entity ? entity.name : "A skill shown on the public skills grid."}
      onSubmit={() => onSubmit(values)}
      saving={saving}
      fieldErrors={fieldErrors}
      submitLabel={entity ? "Save changes" : "Create"}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" required errors={fieldErrors.name}>
          <Input
            id="name"
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            autoFocus
          />
        </Field>
        <Field label="Category" htmlFor="category" errors={fieldErrors.category}>
          <Select
            id="category"
            value={values.category}
            onChange={(e) => set("category", e.target.value as SkillCategory)}
          >
            {(Object.keys(SKILL_CATEGORY_LABELS) as SkillCategory[]).map((k) => (
              <option key={k} value={k}>
                {SKILL_CATEGORY_LABELS[k]}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field
        label="Proficiency"
        errors={fieldErrors.proficiency}
        hint="Shown as level dots, not percentages. Leave unset to hide."
      >
        <div
          role="radiogroup"
          aria-label="Proficiency"
          className="inline-flex overflow-hidden rounded-sm border border-line-700"
        >
          <button
            type="button"
            role="radio"
            aria-checked={values.proficiency === ""}
            onClick={() => set("proficiency", "")}
            className={cn(
              "h-9 px-3 text-xs transition-colors",
              values.proficiency === ""
                ? "bg-surface-700 text-fg-50"
                : "text-fg-500 hover:bg-surface-800 hover:text-fg-100",
            )}
          >
            None
          </button>
          {LEVELS.map((level) => {
            const active = values.proficiency === level;
            return (
              <button
                key={level}
                type="button"
                role="radio"
                aria-checked={active}
                aria-label={`Level ${level}`}
                onClick={() => set("proficiency", level)}
                className={cn(
                  "h-9 w-10 border-l border-line-700 font-mono text-xs transition-colors",
                  active
                    ? "bg-ember-500/15 text-ember-300"
                    : "text-fg-500 hover:bg-surface-800 hover:text-fg-100",
                )}
              >
                {level}
              </button>
            );
          })}
        </div>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Years"
          htmlFor="years"
          errors={fieldErrors.years}
          hint="Optional. Real years of hands-on use."
        >
          <Input
            id="years"
            type="number"
            inputMode="decimal"
            min={0}
            max={50}
            step={0.5}
            value={values.years}
            onChange={(e) => set("years", e.target.value)}
          />
        </Field>
        <Field
          label="Linked technology"
          htmlFor="technology_id"
          errors={fieldErrors.technology_id}
          hint="Linking a technology lets the public site show which projects use this skill."
        >
          <Select
            id="technology_id"
            value={values.technology_id}
            onChange={(e) => set("technology_id", e.target.value)}
          >
            <option value="">Not linked</option>
            {technologies.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Icon"
          htmlFor="icon"
          errors={fieldErrors.icon}
          hint="Optional icon slug, e.g. 'nextjs', 'flutter'."
        >
          <Input
            id="icon"
            value={values.icon}
            onChange={(e) => set("icon", e.target.value)}
            className="font-mono"
          />
        </Field>
        <Field
          label="Color"
          htmlFor="color"
          errors={fieldErrors.color}
          hint="Optional hex, e.g. #3178c6."
        >
          <div className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-6 w-6 shrink-0 rounded-xs border border-line-700"
              style={{ backgroundColor: values.color || "transparent" }}
            />
            <Input
              id="color"
              value={values.color}
              onChange={(e) => set("color", e.target.value)}
              className="font-mono"
              placeholder="#"
            />
          </div>
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

      <div className="space-y-4 border-t border-line-800 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="is_featured">Featured</Label>
            <p className="mt-0.5 text-xs text-fg-500">Highlighted on the home page.</p>
          </div>
          <Switch
            id="is_featured"
            checked={values.is_featured}
            onCheckedChange={(v) => set("is_featured", v)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="is_visible">Visible</Label>
            <p className="mt-0.5 text-xs text-fg-500">Hidden skills stay in admin only.</p>
          </div>
          <Switch
            id="is_visible"
            checked={values.is_visible}
            onCheckedChange={(v) => set("is_visible", v)}
          />
        </div>
      </div>
    </EntityDrawer>
  );
}
