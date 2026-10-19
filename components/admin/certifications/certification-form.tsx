"use client";

import { EntityDrawer } from "@/components/admin/crud/entity-drawer";
import { useFormValues } from "@/components/admin/crud/use-form-values";
import { ImageField } from "@/components/admin/image-field";
import { Field, Hint, Label } from "@/components/ui/field";
import { Input, Switch, Textarea } from "@/components/ui/input";
import type { Certification } from "@/types";

export type CertificationFormValues = {
  title: string;
  issuer: string;
  issue_date: string;
  expiry_date: string;
  credential_id: string;
  credential_url: string;
  certificate_image: string;
  description: string;
  skills: string;
  display_order: number;
  is_visible: boolean;
};

function toValues(c: Certification | null, nextOrder: number): CertificationFormValues {
  return {
    title: c?.title ?? "",
    issuer: c?.issuer ?? "",
    issue_date: c?.issue_date ?? "",
    expiry_date: c?.expiry_date ?? "",
    credential_id: c?.credential_id ?? "",
    credential_url: c?.credential_url ?? "",
    certificate_image: c?.certificate_image ?? "",
    description: c?.description ?? "",
    skills: c?.skills.join(", ") ?? "",
    display_order: c?.display_order ?? nextOrder,
    is_visible: c?.is_visible ?? true,
  };
}

export function CertificationDrawer({
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
  entity: Certification | null;
  nextOrder: number;
  onSubmit: (values: CertificationFormValues) => Promise<void>;
  saving: boolean;
  fieldErrors: Record<string, string[]>;
}) {
  const { values, set } = useFormValues(toValues(entity, nextOrder));

  return (
    <EntityDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={entity ? "Edit certification" : "Add certification"}
      description={entity ? entity.title : "A certificate or course completion."}
      onSubmit={() => onSubmit(values)}
      saving={saving}
      fieldErrors={fieldErrors}
      submitLabel={entity ? "Save changes" : "Create"}
    >
      <Field label="Title" htmlFor="title" required errors={fieldErrors.title}>
        <Input
          id="title"
          value={values.title}
          onChange={(e) => set("title", e.target.value)}
          autoFocus
        />
      </Field>

      <Field label="Issuer" htmlFor="issuer" errors={fieldErrors.issuer}>
        <Input
          id="issuer"
          value={values.issuer}
          onChange={(e) => set("issuer", e.target.value)}
          placeholder="Google, AWS, Coursera…"
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Issue date" htmlFor="issue_date" errors={fieldErrors.issue_date}>
          <Input
            id="issue_date"
            type="date"
            value={values.issue_date}
            onChange={(e) => set("issue_date", e.target.value)}
          />
        </Field>
        <Field label="Expiry date" htmlFor="expiry_date" errors={fieldErrors.expiry_date}>
          <Input
            id="expiry_date"
            type="date"
            value={values.expiry_date}
            onChange={(e) => set("expiry_date", e.target.value)}
          />
        </Field>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Credential ID" htmlFor="credential_id" errors={fieldErrors.credential_id}>
            <Input
              id="credential_id"
              value={values.credential_id}
              onChange={(e) => set("credential_id", e.target.value)}
              className="font-mono"
            />
          </Field>
          <Field
            label="Credential URL"
            htmlFor="credential_url"
            errors={fieldErrors.credential_url}
          >
            <Input
              id="credential_url"
              type="url"
              inputMode="url"
              value={values.credential_url}
              onChange={(e) => set("credential_url", e.target.value)}
              placeholder="https://"
            />
          </Field>
        </div>
        <Hint className="-mt-2">Leave empty unless you have the real credential ID / URL.</Hint>
      </div>

      <ImageField
        label="Certificate image"
        value={values.certificate_image}
        onChange={(url) => set("certificate_image", url ?? "")}
        folder="certificates"
        aspect="video"
        errors={fieldErrors.certificate_image}
      />

      <Field label="Description" htmlFor="description" errors={fieldErrors.description}>
        <Textarea
          id="description"
          rows={3}
          value={values.description}
          onChange={(e) => set("description", e.target.value)}
        />
      </Field>

      <Field label="Skills" htmlFor="skills" errors={fieldErrors.skills} hint="Comma separated.">
        <Input
          id="skills"
          value={values.skills}
          onChange={(e) => set("skills", e.target.value)}
          placeholder="Cloud architecture, IAM, Networking"
        />
      </Field>

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
