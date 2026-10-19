"use client";

import * as React from "react";
import { EntityDrawer } from "@/components/admin/crud/entity-drawer";
import { useFormValues } from "@/components/admin/crud/use-form-values";
import { Field, Label } from "@/components/ui/field";
import { Input, Switch, Textarea } from "@/components/ui/input";
import { slugify } from "@/lib/utils/slug";
import type { Service } from "@/types";

export type ServiceFormValues = {
  title: string;
  slug: string;
  description: string;
  icon: string;
  featured: boolean;
  display_order: number;
  is_visible: boolean;
};

function toValues(s: Service | null, nextOrder: number): ServiceFormValues {
  return {
    title: s?.title ?? "",
    slug: s?.slug ?? "",
    description: s?.description ?? "",
    icon: s?.icon ?? "",
    featured: s?.featured ?? false,
    display_order: s?.display_order ?? nextOrder,
    is_visible: s?.is_visible ?? true,
  };
}

const ICON_EXAMPLES =
  "layers, globe, smartphone, layout-dashboard, braces, landmark, heart-pulse, server, search";

export function ServiceDrawer({
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
  entity: Service | null;
  nextOrder: number;
  onSubmit: (values: ServiceFormValues) => Promise<void>;
  saving: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const { values, set, setValues } = useFormValues(toValues(entity, nextOrder));
  // Existing slugs are stable URLs: only auto-derive for new services until the slug is edited.
  const [slugTouched, setSlugTouched] = React.useState(entity !== null);

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={entity ? "Edit service" : "Add service"}
      description={entity ? entity.title : "What you offer, shown on the services page."}
      onSubmit={() => onSubmit(values)}
      saving={saving}
      fieldErrors={fieldErrors}
      submitLabel={entity ? "Save changes" : "Create"}
    >
      <Field label="Title" htmlFor="title" required errors={fieldErrors.title}>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => {
            const title = e.target.value;
            setValues((prev) => ({
              ...prev,
              title,
              slug: slugTouched ? prev.slug : slugify(title),
            }));
          }}
          placeholder="Web application development"
          autoFocus
        />
      </Field>

      <Field
        label="Slug"
        htmlFor="slug"
        required
        errors={fieldErrors.slug}
        hint="Lowercase letters, numbers and hyphens. Derived from the title until you edit it."
      >
        <Input
          id="slug"
          value={values.slug}
          onChange={(e) => {
            setSlugTouched(true);
            set("slug", e.target.value);
          }}
          onBlur={() => set("slug", slugify(values.slug))}
          className="font-mono"
        />
      </Field>

      <Field label="Description" htmlFor="description" errors={fieldErrors.description}>
        <Textarea
          id="description"
          rows={4}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <Field
        label="Icon"
        htmlFor="icon"
        errors={fieldErrors.icon}
        hint={`Lucide icon name, e.g. ${ICON_EXAMPLES}.`}
      >
        <Input
          id="icon"
          value={values.icon}
          onChange={(e) => set("icon", e.target.value.trim().toLowerCase())}
          className="font-mono"
          placeholder="layers"
        />
      </Field>

      <div className="space-y-4 border-t border-line-800 pt-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="featured">Featured</Label>
            <p className="mt-0.5 text-xs text-fg-500">Highlighted on the home page.</p>
          </div>
          <Switch
            id="featured"
            checked={values.featured}
            onCheckedChange={(v) => set("featured", v)}
          />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label htmlFor="is_visible">Visible</Label>
            <p className="mt-0.5 text-xs text-fg-500">Hidden services stay in admin only.</p>
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
