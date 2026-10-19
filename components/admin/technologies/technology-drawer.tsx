"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Select, Textarea } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { createTechnology, updateTechnology } from "@/lib/actions/technologies";
import { slugify } from "@/lib/utils/slug";
import { SKILL_CATEGORIES } from "@/lib/validation/schemas";
import { SKILL_CATEGORY_LABELS, type SkillCategory, type Technology } from "@/types";

type Draft = {
  name: string;
  slug: string;
  category: SkillCategory;
  color: string;
  icon: string;
  description: string;
};

const EMPTY: Draft = {
  name: "",
  slug: "",
  category: "frontend",
  color: "",
  icon: "",
  description: "",
};

function fromRow(t: Technology): Draft {
  return {
    name: t.name,
    slug: t.slug,
    category: t.category,
    color: t.color ?? "",
    icon: t.icon ?? "",
    description: t.description ?? "",
  };
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

export function TechnologyDrawer({
  open,
  technology,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  technology: Technology | null;
  onOpenChange: (open: boolean) => void;
  onSaved: (row: Technology, mode: "create" | "update") => void;
}) {
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [slugLocked, setSlugLocked] = React.useState(false);
  const create = useAction(createTechnology);
  const update = useAction(updateTechnology);
  const ids = React.useId();

  // Re-seed the form whenever the drawer opens for a different row.
  const [seedKey, setSeedKey] = React.useState<string | null>(null);
  const key = open ? (technology?.id ?? "new") : null;
  if (key !== seedKey) {
    setSeedKey(key);
    if (key) {
      setDraft(technology ? fromRow(technology) : EMPTY);
      setSlugLocked(Boolean(technology));
      create.setFieldErrors({});
      update.setFieldErrors({});
    }
  }

  const pending = create.pending || update.pending;
  const fieldErrors = technology ? update.fieldErrors : create.fieldErrors;

  const submit = async () => {
    const payload = { ...draft, slug: draft.slug || slugify(draft.name) };
    if (technology) {
      await update.run([technology.id, payload], {
        onSuccess: (row) => {
          onSaved(row, "update");
          onOpenChange(false);
        },
      });
    } else {
      await create.run([payload], {
        onSuccess: (row) => {
          onSaved(row, "create");
          onOpenChange(false);
        },
      });
    }
  };

  const swatchColor = HEX.test(draft.color.trim()) ? draft.color.trim() : null;

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={technology ? "Edit technology" : "Add technology"}
      description={
        technology
          ? technology.name
          : "Technologies appear in project stacks and on the skills page."
      }
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => void submit()}
            loading={pending}
            disabled={!draft.name.trim()}
          >
            {technology ? "Save changes" : "Create technology"}
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <Field label="Name" htmlFor={`${ids}-name`} required errors={fieldErrors.name}>
          <Input
            id={`${ids}-name`}
            value={draft.name}
            autoFocus
            placeholder="e.g. Next.js"
            onChange={(e) => {
              const name = e.target.value;
              setDraft((d) => ({ ...d, name, slug: slugLocked ? d.slug : slugify(name) }));
            }}
          />
        </Field>
        <Field
          label="Slug"
          htmlFor={`${ids}-slug`}
          required
          errors={fieldErrors.slug}
          hint="Lowercase, hyphenated. Used in URLs and filters."
        >
          <Input
            id={`${ids}-slug`}
            value={draft.slug}
            className="font-mono text-[13px]"
            onChange={(e) => {
              setSlugLocked(true);
              setDraft((d) => ({ ...d, slug: e.target.value }));
            }}
          />
        </Field>
        <Field label="Category" htmlFor={`${ids}-category`} errors={fieldErrors.category}>
          <Select
            id={`${ids}-category`}
            value={draft.category}
            onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value as SkillCategory }))}
          >
            {SKILL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {SKILL_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Color"
            htmlFor={`${ids}-color`}
            errors={fieldErrors.color}
            hint="Hex, e.g. #3178c6. Used for dots and chips."
          >
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="h-10 w-10 shrink-0 rounded-sm border border-line-600 bg-surface-700"
                style={swatchColor ? { backgroundColor: swatchColor } : undefined}
              />
              <Input
                id={`${ids}-color`}
                value={draft.color}
                placeholder="#000000"
                className="font-mono text-[13px]"
                onChange={(e) => setDraft((d) => ({ ...d, color: e.target.value }))}
              />
            </div>
          </Field>
          <Field
            label="Icon"
            htmlFor={`${ids}-icon`}
            errors={fieldErrors.icon}
            hint="Icon key or lucide name, e.g. “react”, “database”."
          >
            <Input
              id={`${ids}-icon`}
              value={draft.icon}
              className="font-mono text-[13px]"
              onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
            />
          </Field>
        </div>
        <Field
          label="Description"
          htmlFor={`${ids}-description`}
          errors={fieldErrors.description}
          hint="Optional one-liner shown in tooltips."
        >
          <Textarea
            id={`${ids}-description`}
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </Field>
        <button type="submit" className="sr-only">
          Save
        </button>
      </form>
    </Drawer>
  );
}
