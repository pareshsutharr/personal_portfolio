"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, Switch, Textarea } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import { createIndustry, updateIndustry } from "@/lib/actions/industries";
import { slugify } from "@/lib/utils/slug";
import type { Industry } from "@/types";

type Draft = {
  name: string;
  slug: string;
  description: string;
  icon: string;
  project_count: string;
  is_visible: boolean;
};

const EMPTY: Draft = {
  name: "",
  slug: "",
  description: "",
  icon: "",
  project_count: "",
  is_visible: true,
};

function fromRow(i: Industry): Draft {
  return {
    name: i.name,
    slug: i.slug,
    description: i.description ?? "",
    icon: i.icon ?? "",
    project_count: i.project_count === null ? "" : String(i.project_count),
    is_visible: i.is_visible,
  };
}

export function IndustryDrawer({
  open,
  industry,
  autoCount,
  nextOrder,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  industry: Industry | null;
  /** Live count of projects assigned to this industry (for the hint). */
  autoCount: number;
  nextOrder: number;
  onOpenChange: (open: boolean) => void;
  onSaved: (row: Industry, mode: "create" | "update") => void;
}) {
  const [draft, setDraft] = React.useState<Draft>(EMPTY);
  const [slugLocked, setSlugLocked] = React.useState(false);
  const create = useAction(createIndustry);
  const update = useAction(updateIndustry);
  const ids = React.useId();

  const [seedKey, setSeedKey] = React.useState<string | null>(null);
  const key = open ? (industry?.id ?? "new") : null;
  if (key !== seedKey) {
    setSeedKey(key);
    if (key) {
      setDraft(industry ? fromRow(industry) : EMPTY);
      setSlugLocked(Boolean(industry));
      create.setFieldErrors({});
      update.setFieldErrors({});
    }
  }

  const pending = create.pending || update.pending;
  const fieldErrors = industry ? update.fieldErrors : create.fieldErrors;

  const submit = async () => {
    const payload = {
      ...draft,
      slug: draft.slug || slugify(draft.name),
      project_count: draft.project_count.trim(),
      display_order: industry?.display_order ?? nextOrder,
    };
    if (industry) {
      await update.run([industry.id, payload], {
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

  return (
    <Drawer
      open={open}
      onOpenChange={onOpenChange}
      title={industry ? "Edit industry" : "Add industry"}
      description={
        industry ? industry.name : "Industries group projects on the home page and in filters."
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
            {industry ? "Save changes" : "Create industry"}
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
            placeholder="e.g. Fintech"
            onChange={(e) => {
              const name = e.target.value;
              setDraft((d) => ({ ...d, name, slug: slugLocked ? d.slug : slugify(name) }));
            }}
          />
        </Field>
        <Field label="Slug" htmlFor={`${ids}-slug`} required errors={fieldErrors.slug}>
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
        <Field
          label="Description"
          htmlFor={`${ids}-description`}
          errors={fieldErrors.description}
          hint="One line about the kind of work done in this industry."
        >
          <Textarea
            id={`${ids}-description`}
            rows={3}
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Icon"
            htmlFor={`${ids}-icon`}
            errors={fieldErrors.icon}
            hint="lucide icon name, e.g. “landmark”, “heart-pulse”."
          >
            <Input
              id={`${ids}-icon`}
              value={draft.icon}
              className="font-mono text-[13px]"
              placeholder="landmark"
              onChange={(e) => setDraft((d) => ({ ...d, icon: e.target.value }))}
            />
          </Field>
          <Field
            label="Project count override"
            htmlFor={`${ids}-count`}
            errors={fieldErrors.project_count}
            hint={`Empty = automatic (currently ${autoCount}). Set a number to include work not listed as a project.`}
          >
            <Input
              id={`${ids}-count`}
              type="number"
              min={0}
              step={1}
              inputMode="numeric"
              placeholder="auto"
              value={draft.project_count}
              className="font-mono text-[13px]"
              onChange={(e) => setDraft((d) => ({ ...d, project_count: e.target.value }))}
            />
          </Field>
        </div>
        <div className="flex items-center justify-between rounded-md border border-line-800 px-3 py-2.5">
          <div>
            <p className="text-sm text-fg-100">Visible</p>
            <p className="text-xs text-fg-500">
              Hidden industries stay editable but never render publicly.
            </p>
          </div>
          <Switch
            checked={draft.is_visible}
            onCheckedChange={(v) => setDraft((d) => ({ ...d, is_visible: v }))}
            aria-label="Visible"
          />
        </div>
        <button type="submit" className="sr-only">
          Save
        </button>
      </form>
    </Drawer>
  );
}
