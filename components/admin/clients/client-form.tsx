"use client";

import { EntityDrawer } from "@/components/admin/crud/entity-drawer";
import { useFormValues } from "@/components/admin/crud/use-form-values";
import { ImageField } from "@/components/admin/image-field";
import { Field, Label } from "@/components/ui/field";
import { Input, Select, Switch } from "@/components/ui/input";
import type { ClientLogo } from "@/types";

export type ClientFormValues = {
  name: string;
  logo_url: string | null;
  url: string;
  display_mode: "auto" | "logo" | "name";
  display_order: number;
  is_visible: boolean;
};

function toValues(c: ClientLogo | null, nextOrder: number): ClientFormValues {
  return {
    name: c?.name ?? "",
    logo_url: c?.logo_url ?? null,
    url: c?.url ?? "",
    display_mode: (c?.display_mode as "auto" | "logo" | "name" | undefined) ?? "auto",
    display_order: c?.display_order ?? nextOrder,
    is_visible: c?.is_visible ?? true,
  };
}

export function ClientDrawer({
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
  entity: ClientLogo | null;
  nextOrder: number;
  onSubmit: (values: ClientFormValues) => Promise<void>;
  saving: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const { values, set } = useFormValues(toValues(entity, nextOrder));

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={entity ? "Edit client" : "Add client"}
      description={entity ? entity.name : "A company or product you have worked with."}
      onSubmit={() => onSubmit(values)}
      saving={saving}
      fieldErrors={fieldErrors}
      submitLabel={entity ? "Save changes" : "Create"}
    >
      <Field label="Name" htmlFor="name" required errors={fieldErrors.name}>
        <Input
          id="name"
          value={values.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="Growth Avenues"
          autoFocus
        />
      </Field>

      <ImageField
        label="Logo"
        value={values.logo_url}
        onChange={(url) => set("logo_url", url)}
        folder="logos"
        aspect="wide"
        errors={fieldErrors.logo_url}
        hint="SVG or transparent PNG works best. Shown in white on a dark strip, about 28px tall. Without a logo the name is shown as text."
      />

      <Field
        label="Show as"
        htmlFor="display_mode"
        errors={fieldErrors.display_mode}
        hint="Auto shows the logo when one is uploaded, otherwise the name."
      >
        <Select
          id="display_mode"
          value={values.display_mode}
          onChange={(e) => set("display_mode", e.target.value as "auto" | "logo" | "name")}
        >
          <option value="auto">Auto (logo if available)</option>
          <option value="logo">Logo only</option>
          <option value="name">Name as text</option>
        </Select>
      </Field>

      <Field
        label="Website"
        htmlFor="url"
        errors={fieldErrors.url}
        hint="Optional. Makes the logo clickable."
      >
        <Input
          id="url"
          type="url"
          value={values.url}
          onChange={(e) => set("url", e.target.value)}
          placeholder="https://"
        />
      </Field>

      <div className="flex items-center justify-between gap-4 border-t border-line-800 pt-4">
        <div>
          <Label htmlFor="is_visible">Visible</Label>
          <p className="mt-0.5 text-xs text-fg-500">Hidden clients stay in admin only.</p>
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
