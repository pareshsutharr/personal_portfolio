"use client";

import * as React from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { FormProvider, useForm, useWatch, type FieldErrors, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Copy, ExternalLink, Save, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Input, Select, Switch } from "@/components/ui/input";
import { Panel, PanelBody, PanelHeader, Tabs } from "@/components/ui/panel";
import { useAction } from "@/hooks/use-action";
import {
  createProject,
  duplicateProject,
  softDeleteProject,
  updateProject,
} from "@/lib/actions/projects";
import { formatDateTime, relativeTime } from "@/lib/utils/format";
import { projectSchema, type ProjectInput } from "@/lib/validation/schemas";
import type { ProjectFeature, ProjectImage, ProjectStatus } from "@/types";
import { BasicsTab } from "./basics-tab";
import { CaseStudyTab } from "./case-study-tab";
import { SideRow, TabPanel } from "./editor-fields";
import {
  CONFIDENTIAL_MODE_OPTIONS,
  FIELD_TAB,
  STATUS_OPTIONS,
  VISIBILITY_OPTIONS,
  toFormValues,
  type EditorProject,
  type EditorTab,
  type ProjectEditorProps,
  type ProjectFormValues,
} from "./editor-types";
import { FeaturesTab } from "./features-tab";
import { ImagesTab } from "./images-tab";
import { LinksTab } from "./links-tab";
import { RelatedTab } from "./related-tab";
import { SeoTab } from "./seo-tab";
import { TechnologiesTab } from "./technologies-tab";

const STATUS_TONE: Record<ProjectStatus, "neutral" | "success" | "outline"> = {
  draft: "neutral",
  published: "success",
  archived: "outline",
};

const TAB_ORDER: EditorTab[] = [
  "basics",
  "case-study",
  "technologies",
  "features",
  "images",
  "links",
  "seo",
  "related",
];

export function ProjectEditor({
  project,
  technologies,
  industries,
  clients,
  otherProjects,
  siteUrl,
}: ProjectEditorProps) {
  const router = useRouter();
  const [current, setCurrent] = React.useState<EditorProject | null>(project);
  const [features, setFeatures] = React.useState<ProjectFeature[]>(project?.features ?? []);
  const [images, setImages] = React.useState<ProjectImage[]>(project?.images ?? []);
  const [tab, setTab] = React.useState<EditorTab>("basics");
  const [slugLocked, setSlugLocked] = React.useState(Boolean(project));
  const [intent, setIntent] = React.useState<"save" | "publish" | null>(null);
  const [trashOpen, setTrashOpen] = React.useState(false);

  const form = useForm<ProjectFormValues, unknown, ProjectInput>({
    // The form keeps strings/booleans; the schema's input type is a superset of
    // ProjectFormValues, so narrowing the resolver here is sound.
    resolver: zodResolver(projectSchema) as unknown as Resolver<
      ProjectFormValues,
      unknown,
      ProjectInput
    >,
    defaultValues: toFormValues(project),
    mode: "onBlur",
  });
  const {
    control,
    register,
    setValue,
    setError,
    formState: { isDirty, errors },
  } = form;

  const create = useAction(createProject);
  const update = useAction(updateProject);
  const duplicate = useAction(duplicateProject);
  const trash = useAction(softDeleteProject);
  const saving = create.pending || update.pending;

  const [
    title,
    slug,
    status,
    visibility,
    featured,
    confidential,
    confidentialMode,
    coverImage,
    technologyIds,
    relatedIds,
  ] = useWatch({
    control,
    name: [
      "title",
      "slug",
      "status",
      "visibility",
      "featured",
      "confidential",
      "confidential_mode",
      "cover_image",
      "technology_ids",
      "related_project_ids",
    ],
  });

  const applyFieldErrors = React.useCallback(
    (fieldErrors?: Record<string, string[]>) => {
      if (!fieldErrors) return;
      let firstTab: EditorTab | null = null;
      for (const [key, messages] of Object.entries(fieldErrors)) {
        const name = key as keyof ProjectFormValues;
        if (!(name in FIELD_TAB) && name !== "status" && name !== "visibility") continue;
        setError(name, { type: "server", message: messages[0] });
        firstTab ??= FIELD_TAB[name] ?? null;
      }
      if (firstTab) setTab(firstTab);
    },
    [setError],
  );

  const onInvalid = React.useCallback((errs: FieldErrors<ProjectFormValues>) => {
    const keys = Object.keys(errs) as (keyof ProjectFormValues)[];
    const target = TAB_ORDER.find((t) => keys.some((k) => FIELD_TAB[k] === t));
    if (target) setTab(target);
    toast.error("Please fix the highlighted fields.");
  }, []);

  const submit = React.useCallback(
    (mode: "save" | "publish") =>
      form.handleSubmit(async (values) => {
        setIntent(mode);
        const payload: ProjectInput = {
          ...values,
          status: mode === "publish" ? "published" : values.status,
        };
        const onSuccess = (
          row: EditorProject extends infer T
            ? Omit<T, "technology_ids" | "related_project_ids" | "features" | "images">
            : never,
        ) => {
          const next: EditorProject = {
            ...row,
            technology_ids: payload.technology_ids,
            related_project_ids: payload.related_project_ids,
            features,
            images,
          };
          if (!current) {
            router.replace(`/admin/projects/${row.id}` as Route);
            router.refresh();
            return;
          }
          setCurrent(next);
          form.reset(toFormValues(next));
          router.refresh();
        };
        const result = current
          ? await update.run([current.id, payload], { onSuccess })
          : await create.run([payload], { onSuccess });
        if (result && !result.ok) applyFieldErrors(result.fieldErrors);
        setIntent(null);
      }, onInvalid)(),
    [form, current, features, images, router, update, create, applyFieldErrors, onInvalid],
  );

  // Cmd/Ctrl+S saves.
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (!saving) void submit("save");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [submit, saving]);

  // Warn before leaving with unsaved changes.
  React.useEffect(() => {
    if (!isDirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [isDirty]);

  const errorCount = Object.keys(errors).length;
  const previewHref = current ? `/preview/projects/${current.slug}` : null;
  const isPublished = status === "published";

  const tabs = [
    { value: "basics", label: "Basics" },
    { value: "case-study", label: "Case study" },
    { value: "technologies", label: "Technologies", count: technologyIds.length },
    { value: "features", label: "Features", count: features.length },
    { value: "images", label: "Images", count: images.length + (coverImage ? 1 : 0) },
    { value: "links", label: "Links" },
    { value: "seo", label: "SEO" },
    { value: "related", label: "Related", count: relatedIds.length },
  ];

  return (
    <FormProvider {...form}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit("save");
        }}
        noValidate
      >
        {/* Sticky top bar */}
        <div className="sticky top-0 z-20 -mt-2 mb-6 border-b border-line-800 bg-bg-950/95 py-3 backdrop-blur">
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/admin/projects"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm text-fg-500 transition-colors hover:text-fg-50"
              aria-label="Back to projects"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex min-w-0 flex-1 items-center gap-3">
              <h1 className="truncate text-base font-semibold tracking-tight text-fg-50">
                {title.trim() || (current ? current.title : "New project")}
              </h1>
              <Badge tone={STATUS_TONE[status]} mono>
                {status}
              </Badge>
              {isDirty ? (
                <span className="hidden items-center gap-1.5 font-mono text-[10px] tracking-wider text-amber-300 uppercase sm:inline-flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden /> Unsaved
                </span>
              ) : current ? (
                <span
                  className="hidden font-mono text-[10px] tracking-wider text-fg-500 uppercase sm:inline"
                  suppressHydrationWarning
                >
                  Saved {relativeTime(current.updated_at)}
                </span>
              ) : null}
              {errorCount > 0 ? (
                <span className="font-mono text-[10px] tracking-wider text-crimson-400 uppercase">
                  {errorCount} issue{errorCount === 1 ? "" : "s"}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              {previewHref ? (
                <a
                  href={previewHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={isDirty ? "Opens the last saved version" : "Open preview"}
                  className="inline-flex h-8 items-center gap-2 rounded-sm border border-line-600 px-3 text-xs font-medium text-fg-100 transition-colors hover:border-fg-300 hover:bg-surface-800"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Preview
                </a>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled
                  title="Save the project to enable preview"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Preview
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                variant={isPublished ? "primary" : "secondary"}
                loading={saving && intent === "save"}
                disabled={saving}
              >
                <Save className="h-3.5 w-3.5" />
                {isPublished ? "Save" : "Save draft"}
              </Button>
              {!isPublished ? (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => void submit("publish")}
                  loading={saving && intent === "publish"}
                  disabled={saving}
                >
                  <Send className="h-3.5 w-3.5" /> Publish
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
          {/* Main column */}
          <Panel>
            <Tabs
              tabs={tabs}
              value={tab}
              onChange={(v) => setTab(v as EditorTab)}
              className="px-2"
            />
            <PanelBody className="px-5 py-6">
              <TabPanel active={tab === "basics"}>
                <BasicsTab
                  slugLocked={slugLocked}
                  onSlugLockedChange={setSlugLocked}
                  siteUrl={siteUrl}
                />
              </TabPanel>
              <TabPanel active={tab === "case-study"}>
                <CaseStudyTab />
              </TabPanel>
              <TabPanel active={tab === "technologies"}>
                <TechnologiesTab technologies={technologies} />
              </TabPanel>
              <TabPanel active={tab === "features"}>
                <FeaturesTab
                  projectId={current?.id ?? null}
                  features={features}
                  onChange={setFeatures}
                />
              </TabPanel>
              <TabPanel active={tab === "images"}>
                <ImagesTab projectId={current?.id ?? null} images={images} onChange={setImages} />
              </TabPanel>
              <TabPanel active={tab === "links"}>
                <LinksTab />
              </TabPanel>
              <TabPanel active={tab === "seo"}>
                <SeoTab siteUrl={siteUrl} />
              </TabPanel>
              <TabPanel active={tab === "related"}>
                <RelatedTab options={otherProjects} />
              </TabPanel>
            </PanelBody>
          </Panel>

          {/* Side panel */}
          <aside className="space-y-4 lg:sticky lg:top-[68px]">
            <Panel>
              <PanelHeader title="Publishing" />
              <PanelBody className="space-y-4">
                <SideRow label="Status" htmlFor="side-status" stacked>
                  <Select id="side-status" {...register("status")}>
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </SideRow>
                <SideRow
                  label="Visibility"
                  htmlFor="side-visibility"
                  stacked
                  hint={VISIBILITY_OPTIONS.find((o) => o.value === visibility)?.hint}
                >
                  <Select id="side-visibility" {...register("visibility")}>
                    {VISIBILITY_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </Select>
                </SideRow>
                <SideRow label="Featured" hint="Pinned on the home page.">
                  <Switch
                    checked={featured}
                    onCheckedChange={(v) => setValue("featured", v, { shouldDirty: true })}
                    aria-label="Featured"
                  />
                </SideRow>
                <SideRow label="Confidential" hint="Hide client details publicly.">
                  <Switch
                    checked={confidential}
                    onCheckedChange={(v) => setValue("confidential", v, { shouldDirty: true })}
                    aria-label="Confidential"
                  />
                </SideRow>
                {confidential ? (
                  <SideRow
                    label="Confidential mode"
                    htmlFor="side-conf-mode"
                    stacked
                    hint={CONFIDENTIAL_MODE_OPTIONS.find((o) => o.value === confidentialMode)?.hint}
                  >
                    <Select id="side-conf-mode" {...register("confidential_mode")}>
                      {CONFIDENTIAL_MODE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </Select>
                  </SideRow>
                ) : null}
              </PanelBody>
            </Panel>

            <Panel>
              <PanelHeader title="Organisation" />
              <PanelBody className="space-y-4">
                <SideRow label="Industry" htmlFor="side-industry" stacked>
                  <Select id="side-industry" {...register("industry_id")}>
                    <option value="">— None —</option>
                    {industries.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.name}
                      </option>
                    ))}
                  </Select>
                </SideRow>
                <SideRow
                  label="Client logo"
                  htmlFor="side-client-logo"
                  hint="Shown in the case study header. Manage logos under Clients."
                  stacked
                >
                  <Select id="side-client-logo" {...register("client_logo_id")}>
                    <option value="">— None —</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </SideRow>
                <SideRow label="Display order" htmlFor="side-order" hint="Lower comes first.">
                  <Input
                    id="side-order"
                    type="number"
                    min={0}
                    step={1}
                    className="h-9 w-20 text-right font-mono text-[13px]"
                    {...register("display_order", { valueAsNumber: true })}
                  />
                </SideRow>
                {errors.display_order?.message ? (
                  <p role="alert" className="text-xs text-crimson-400">
                    {errors.display_order.message}
                  </p>
                ) : null}
              </PanelBody>
            </Panel>

            {current ? (
              <>
                <Panel>
                  <PanelBody className="space-y-2 py-3">
                    <Meta label="Last updated" value={formatDateTime(current.updated_at)} />
                    <Meta label="Created" value={formatDateTime(current.created_at)} />
                    <Meta label="Slug" value={slug} mono />
                  </PanelBody>
                </Panel>

                <Panel className="border-crimson-500/20">
                  <PanelHeader title="Danger zone" />
                  <PanelBody className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      loading={duplicate.pending}
                      onClick={() =>
                        void duplicate.run([current.id], {
                          onSuccess: (p) => router.push(`/admin/projects/${p.id}` as Route),
                        })
                      }
                    >
                      <Copy className="h-3.5 w-3.5" /> Duplicate project
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-crimson-400 hover:bg-crimson-500/10 hover:text-crimson-400"
                      onClick={() => setTrashOpen(true)}
                    >
                      <Trash2 className="h-3.5 w-3.5" /> Move to trash
                    </Button>
                  </PanelBody>
                </Panel>
              </>
            ) : null}
          </aside>
        </div>
      </form>

      {current ? (
        <ConfirmDialog
          open={trashOpen}
          onOpenChange={setTrashOpen}
          title={`Move “${current.title}” to trash?`}
          description="It disappears from the public site immediately. You can restore it from the trash."
          confirmLabel="Move to trash"
          loading={trash.pending}
          onConfirm={() =>
            void trash.run([current.id], {
              onSuccess: () => {
                setTrashOpen(false);
                router.push("/admin/projects");
              },
            })
          }
        />
      ) : null}
    </FormProvider>
  );
}

function Meta({ label, value, mono }: { label: string; value: string | null; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-xs">
      <span className="font-mono text-[10px] tracking-wider text-fg-500 uppercase">{label}</span>
      <span className={mono ? "truncate font-mono text-[11px] text-fg-300" : "text-fg-300"}>
        {value ?? "—"}
      </span>
    </div>
  );
}
