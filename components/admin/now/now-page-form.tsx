"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Clock, Info, TriangleAlert } from "lucide-react";
import {
  FormNotice,
  SelectField,
  StickySaveBar,
  SwitchField,
  TextareaField,
  useFormValues,
  useScrollToFirstError,
  useUnsavedWarning,
} from "@/components/admin/forms/form-kit";
import { FormSection } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { useAction } from "@/hooks/use-action";
import { updateNowPage } from "@/lib/actions/now";
import { formatDateTime, relativeTime } from "@/lib/utils/format";
import type { NowPage, Project } from "@/types";

export type ProjectOption = Pick<Project, "id" | "title" | "status">;

type NowFormValues = {
  currently_building: string;
  currently_learning: string;
  current_focus: string;
  open_to: string;
  latest_project_id: string;
  is_visible: boolean;
};

const PLACEHOLDER_PREFIX = "[PLACEHOLDER]";
const TEXT_KEYS = ["currently_building", "currently_learning", "current_focus", "open_to"] as const;

const s = (v: string | null | undefined) => v ?? "";

function toValues(x: NowPage | null): NowFormValues {
  return {
    currently_building: s(x?.currently_building),
    currently_learning: s(x?.currently_learning),
    current_focus: s(x?.current_focus),
    open_to: s(x?.open_to),
    latest_project_id: s(x?.latest_project_id),
    is_visible: x?.is_visible ?? false,
  };
}

const isPlaceholder = (v: string) => v.trimStart().startsWith(PLACEHOLDER_PREFIX);

export function NowPageForm({ now, projects }: { now: NowPage | null; projects: ProjectOption[] }) {
  const router = useRouter();
  const { values, set, replace, reset, dirty } = useFormValues(toValues(now));
  const { run, pending, fieldErrors } = useAction(updateNowPage);
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(now?.updated_at ?? null);

  useUnsavedWarning(dirty);
  useScrollToFirstError(fieldErrors);

  const placeholderCount = TEXT_KEYS.filter((k) => isPlaceholder(values[k])).length;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await run([values], {
      onSuccess: (saved) => {
        replace(toValues(saved));
        setUpdatedAt(saved.updated_at);
        router.refresh();
      },
    });
  };

  const projectOptions = projects.map((p) => ({
    value: p.id,
    label: p.status === "published" ? p.title : `${p.title} (${p.status})`,
  }));

  const placeholderHint = (key: (typeof TEXT_KEYS)[number]) =>
    isPlaceholder(values[key]) ? (
      <span className="text-amber-300">Still a placeholder — replace before publishing.</span>
    ) : undefined;

  return (
    <form onSubmit={onSubmit} noValidate>
      <div className="mb-6 space-y-3">
        <FormNotice icon={Info}>
          Seeded values start with <code className="text-fg-100">{PLACEHOLDER_PREFIX}</code>. They
          are visible only to you here until you replace them: the public{" "}
          <code className="text-fg-100">/now</code> page stays hidden while visibility is off.
        </FormNotice>
        {values.is_visible && placeholderCount > 0 ? (
          <FormNotice tone="warning" icon={TriangleAlert}>
            Visibility is on but {placeholderCount}{" "}
            {placeholderCount === 1 ? "field still contains" : "fields still contain"} placeholder
            text. It will be published exactly as written.
          </FormNotice>
        ) : null}
      </div>

      <Panel className="divide-y divide-line-800">
        <div className="px-5 py-6">
          <FormSection
            title="Status"
            description="Whether /now is reachable, and when it last changed."
          >
            <SwitchField
              id="is_visible"
              label="Publish the /now page"
              description="Also requires “Show the /now page” in site settings to appear in navigation."
              checked={values.is_visible}
              onCheckedChange={(v) => set("is_visible", v)}
              errors={fieldErrors.is_visible}
            />
            <div className="flex items-center gap-2 rounded-sm border border-line-800 px-3 py-2.5 text-xs">
              <Clock className="h-3.5 w-3.5 text-fg-500" />
              <span className="text-fg-300">Last updated</span>
              <span className="ml-auto font-mono text-fg-100">
                {updatedAt ? `${formatDateTime(updatedAt)} · ${relativeTime(updatedAt)}` : "Never"}
              </span>
            </div>
          </FormSection>
        </div>

        <div className="px-5 py-6">
          <FormSection
            title="Right now"
            description="Short paragraphs. Write like a status update, not a bio."
          >
            <TextareaField
              id="currently_building"
              label="Currently building"
              rows={3}
              max={400}
              value={values.currently_building}
              onChange={(v) => set("currently_building", v)}
              errors={fieldErrors.currently_building}
              hint={placeholderHint("currently_building")}
            />
            <TextareaField
              id="currently_learning"
              label="Currently learning"
              rows={3}
              max={400}
              value={values.currently_learning}
              onChange={(v) => set("currently_learning", v)}
              errors={fieldErrors.currently_learning}
              hint={placeholderHint("currently_learning")}
            />
            <TextareaField
              id="current_focus"
              label="Current focus"
              rows={3}
              max={400}
              value={values.current_focus}
              onChange={(v) => set("current_focus", v)}
              errors={fieldErrors.current_focus}
              hint={placeholderHint("current_focus")}
            />
          </FormSection>
        </div>

        <div className="px-5 py-6">
          <FormSection
            title="Open to"
            description="What kind of work or conversations you welcome."
          >
            <TextareaField
              id="open_to"
              label="Open to"
              rows={3}
              max={400}
              value={values.open_to}
              onChange={(v) => set("open_to", v)}
              errors={fieldErrors.open_to}
              hint={placeholderHint("open_to")}
            />
          </FormSection>
        </div>

        <div className="px-5 py-6">
          <FormSection
            title="Latest project"
            description="Linked from the /now page as the most recent work."
          >
            <SelectField
              id="latest_project_id"
              label="Project"
              value={values.latest_project_id}
              onChange={(v) => set("latest_project_id", v)}
              options={projectOptions}
              placeholder={projects.length ? "None" : "No projects yet"}
              disabled={projects.length === 0}
              errors={fieldErrors.latest_project_id}
              hint="Drafts are listed for convenience but only published projects link publicly."
              className="sm:max-w-md"
            />
          </FormSection>
        </div>

        <StickySaveBar
          dirty={dirty}
          pending={pending}
          onDiscard={reset}
          meta={updatedAt ? `Last saved ${formatDateTime(updatedAt)}` : undefined}
        />
      </Panel>
    </form>
  );
}
