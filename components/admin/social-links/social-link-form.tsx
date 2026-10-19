"use client";

import * as React from "react";
import {
  SelectField,
  SwitchField,
  TextField,
  useFormValues,
} from "@/components/admin/forms/form-kit";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { useAction } from "@/hooks/use-action";
import { createSocialLink, updateSocialLink } from "@/lib/actions/social-links";
import { SOCIAL_PLATFORMS } from "@/lib/validation/schemas";
import type { SocialLink } from "@/types";
import {
  PLATFORM_LABELS,
  PLATFORM_URL_PLACEHOLDERS,
  PlatformIcon,
  isSocialPlatform,
  type SocialPlatform,
} from "./platform-icon";

type SocialLinkFormValues = {
  platform: SocialPlatform;
  username: string;
  url: string;
  icon: string;
  is_visible: boolean;
};

const PLATFORM_OPTIONS = SOCIAL_PLATFORMS.map((value) => ({
  value,
  label: PLATFORM_LABELS[value],
}));

function toValues(link: SocialLink | null): SocialLinkFormValues {
  return {
    platform: link && isSocialPlatform(link.platform) ? link.platform : "github",
    username: link?.username ?? "",
    url: link?.url ?? "",
    icon: link?.icon ?? "",
    is_visible: link?.is_visible ?? true,
  };
}

const FORM_ID = "social-link-form";

export function SocialLinkDrawer({
  open,
  onOpenChange,
  link,
  nextOrder,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = create */
  link: SocialLink | null;
  /** display_order for a new row */
  nextOrder: number;
  onSaved: (link: SocialLink) => void;
}) {
  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={link ? "Edit link" : "Add link"}
      description={
        link ? PLATFORM_LABELS[toValues(link).platform] : "Shown in the footer and contact page."
      }
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
        <SocialLinkForm
          key={link?.id ?? "new"}
          link={link}
          nextOrder={nextOrder}
          onSaved={onSaved}
        />
      ) : null}
    </Drawer>
  );
}

/*
 * The submit button lives in the drawer footer, outside the <form>, so it
 * targets the form by id. Pending state is mirrored through a data attribute
 * on the form to keep this component dumb.
 */
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
      Save link
    </Button>
  );
}

function SocialLinkForm({
  link,
  nextOrder,
  onSaved,
}: {
  link: SocialLink | null;
  nextOrder: number;
  onSaved: (link: SocialLink) => void;
}) {
  const { values, set } = useFormValues(toValues(link));
  const create = useAction(createSocialLink);
  const update = useAction(updateSocialLink);
  const pending = link ? update.pending : create.pending;
  const fieldErrors = link ? update.fieldErrors : create.fieldErrors;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { ...values, display_order: link ? link.display_order : nextOrder };
    if (link) await update.run([link.id, payload], { onSuccess: onSaved });
    else await create.run([payload], { onSuccess: onSaved });
  };

  return (
    <form id={FORM_ID} onSubmit={onSubmit} noValidate data-pending={pending} className="space-y-5">
      <div className="flex items-end gap-3">
        <SelectField
          id="platform"
          label="Platform"
          required
          value={values.platform}
          onChange={(v) => set("platform", v)}
          options={PLATFORM_OPTIONS}
          errors={fieldErrors.platform}
          className="flex-1"
        />
        <span className="mb-px flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-line-700 bg-surface-800 text-fg-100">
          <PlatformIcon platform={values.platform} className="h-4 w-4" />
        </span>
      </div>

      <TextField
        id="url"
        label="URL"
        required
        type="url"
        value={values.url}
        onChange={(v) => set("url", v)}
        errors={fieldErrors.url}
        placeholder={PLATFORM_URL_PLACEHOLDERS[values.platform]}
        hint={values.platform === "email" ? "Use a mailto: link." : "Include https://."}
        mono
      />

      <TextField
        id="username"
        label="Display name"
        value={values.username}
        onChange={(v) => set("username", v)}
        errors={fieldErrors.username}
        hint="Optional. Shown instead of the raw URL, e.g. @pareshsuthar."
        placeholder="@username"
      />

      <TextField
        id="icon"
        label="Custom icon"
        value={values.icon}
        onChange={(v) => set("icon", v)}
        errors={fieldErrors.icon}
        hint="Optional lucide icon name for the public site. Leave empty to use the platform default."
        placeholder="globe"
        mono
      />

      <SwitchField
        id="is_visible"
        label="Visible"
        description="Hidden links stay in the list but never render publicly."
        checked={values.is_visible}
        onCheckedChange={(v) => set("is_visible", v)}
        errors={fieldErrors.is_visible}
      />
    </form>
  );
}
