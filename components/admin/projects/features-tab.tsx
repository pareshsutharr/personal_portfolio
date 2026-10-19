"use client";

import * as React from "react";
import { ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import { SortableList } from "@/components/admin/sortable-list";
import { Button } from "@/components/ui/button";
import { ConfirmDialog, Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Hint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAction } from "@/hooks/use-action";
import {
  createProjectFeature,
  deleteProjectFeature,
  reorderProjectFeatures,
  updateProjectFeature,
} from "@/lib/actions/project-features";
import type { ProjectFeature } from "@/types";
import { AutoTextarea } from "./editor-fields";

type Draft = { id: string | null; title: string; description: string; icon: string };
const EMPTY: Draft = { id: null, title: "", description: "", icon: "" };

export function FeaturesTab({
  projectId,
  features,
  onChange,
}: {
  projectId: string | null;
  features: ProjectFeature[];
  onChange: (next: ProjectFeature[]) => void;
}) {
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const [deleting, setDeleting] = React.useState<ProjectFeature | null>(null);
  const create = useAction(createProjectFeature);
  const update = useAction(updateProjectFeature);
  const remove = useAction(deleteProjectFeature);
  const reorder = useAction(reorderProjectFeatures);
  const ids = React.useId();

  if (!projectId) {
    return (
      <EmptyState
        icon={ListChecks}
        title="Save the project first"
        description="Key features are stored per project. Save a draft, then add features here."
      />
    );
  }

  const fieldErrors = draft?.id ? update.fieldErrors : create.fieldErrors;
  const saving = create.pending || update.pending;

  const submit = async () => {
    if (!draft) return;
    const payload = {
      project_id: projectId,
      title: draft.title,
      description: draft.description,
      icon: draft.icon,
      display_order: draft.id
        ? (features.find((f) => f.id === draft.id)?.display_order ?? 0)
        : features.length + 1,
    };
    if (draft.id) {
      const id = draft.id;
      await update.run([id, payload], {
        onSuccess: (row) => {
          onChange(features.map((f) => (f.id === id ? row : f)));
          setDraft(null);
        },
      });
    } else {
      await create.run([payload], {
        onSuccess: (row) => {
          onChange([...features, row]);
          setDraft(null);
        },
      });
    }
  };

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-fg-100">Key features</p>
          <Hint>Short, scannable bullets shown as a grid on the case study. Drag to reorder.</Hint>
        </div>
        <Button type="button" size="sm" onClick={() => setDraft(EMPTY)}>
          <Plus className="h-3.5 w-3.5" /> Add feature
        </Button>
      </div>

      {features.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title="No features yet"
          description="Add 3–6 features that define the product: what it does, not how it is built."
          action={
            <Button type="button" size="sm" variant="secondary" onClick={() => setDraft(EMPTY)}>
              <Plus className="h-3.5 w-3.5" /> Add feature
            </Button>
          }
        />
      ) : (
        <SortableList
          items={features}
          disabled={reorder.pending}
          onReorder={(order, next) => {
            onChange(next);
            void reorder.run([order], { silent: true });
          }}
          renderItem={(f, handle, index) => (
            <>
              {handle}
              <span className="w-6 font-mono text-[11px] text-fg-500">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg-50">
                  {f.title}
                  {f.icon ? (
                    <span className="ml-2 font-mono text-[11px] text-fg-500">{f.icon}</span>
                  ) : null}
                </p>
                {f.description ? (
                  <p className="truncate text-xs text-fg-500">{f.description}</p>
                ) : null}
              </div>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Edit ${f.title}`}
                className="h-8 w-8"
                onClick={() =>
                  setDraft({
                    id: f.id,
                    title: f.title,
                    description: f.description ?? "",
                    icon: f.icon ?? "",
                  })
                }
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                aria-label={`Delete ${f.title}`}
                className="h-8 w-8 text-fg-500 hover:text-crimson-400"
                onClick={() => setDeleting(f)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
        />
      )}

      <Drawer
        open={draft !== null}
        onOpenChange={(o) => !o && setDraft(null)}
        title={draft?.id ? "Edit feature" : "Add feature"}
        description="Saved immediately to this project."
        footer={
          <>
            <Button type="button" variant="ghost" onClick={() => setDraft(null)} disabled={saving}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={() => void submit()}
              loading={saving}
              disabled={!draft?.title.trim()}
            >
              {draft?.id ? "Save feature" : "Add feature"}
            </Button>
          </>
        }
      >
        {draft ? (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              void submit();
            }}
          >
            <Field label="Title" htmlFor={`${ids}-ft`} required errors={fieldErrors.title}>
              <Input
                id={`${ids}-ft`}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="e.g. Real-time portfolio valuation"
                autoFocus
              />
            </Field>
            <Field
              label="Description"
              htmlFor={`${ids}-fd`}
              errors={fieldErrors.description}
              hint="One or two sentences."
            >
              <AutoTextarea
                id={`${ids}-fd`}
                rows={3}
                value={draft.description}
                onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              />
            </Field>
            <Field
              label="Icon"
              htmlFor={`${ids}-fi`}
              errors={fieldErrors.icon}
              hint="Optional lucide icon name, e.g. “shield-check”, “bar-chart-3”."
            >
              <Input
                id={`${ids}-fi`}
                value={draft.icon}
                onChange={(e) => setDraft({ ...draft, icon: e.target.value })}
                className="font-mono text-[13px]"
              />
            </Field>
            <button type="submit" className="sr-only">
              Save
            </button>
          </form>
        ) : null}
      </Drawer>

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={`Delete “${deleting?.title ?? ""}”?`}
        confirmLabel="Delete feature"
        loading={remove.pending}
        onConfirm={async () => {
          if (!deleting) return;
          const id = deleting.id;
          await remove.run([id], {
            onSuccess: () => {
              onChange(features.filter((f) => f.id !== id));
              setDeleting(null);
            },
          });
        }}
      />
    </>
  );
}
