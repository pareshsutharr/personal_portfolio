"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { RefreshCw } from "lucide-react";
import { Field, Hint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { slugify } from "@/lib/utils/slug";
import { AutoTextarea, ChipsInput, LabelWithCounter } from "./editor-fields";
import { CATEGORY_SUGGESTIONS, PLATFORM_OPTIONS, type ProjectFormValues } from "./editor-types";

export function BasicsTab({
  slugLocked,
  onSlugLockedChange,
  siteUrl,
}: {
  slugLocked: boolean;
  onSlugLockedChange: (locked: boolean) => void;
  siteUrl: string;
}) {
  const {
    register,
    control,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitted },
  } = useFormContext<ProjectFormValues>();

  const slug = watch("slug");
  const shortDescription = watch("short_description");
  const yearLabel = watch("year_label");
  const ids = React.useId();

  const regenerateSlug = () => {
    setValue("slug", slugify(getValues("title")), { shouldDirty: true, shouldValidate: true });
    onSlugLockedChange(false);
  };

  return (
    <>
      <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
        <Field
          label="Title"
          htmlFor={`${ids}-title`}
          errors={errors.title?.message}
          required
          className="md:col-span-2"
        >
          <Input
            id={`${ids}-title`}
            placeholder="e.g. Wealth management platform for an NBFC"
            autoFocus={!getValues("title")}
            className="text-base"
            {...register("title", {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                if (!slugLocked) {
                  setValue("slug", slugify(e.target.value), { shouldValidate: isSubmitted });
                }
              },
            })}
          />
        </Field>

        <Field
          label="Slug"
          htmlFor={`${ids}-slug`}
          errors={errors.slug?.message}
          required
          className="md:col-span-2"
          hint={
            <span className="font-mono text-[11px]">
              {siteUrl || ""}/projects/<span className="text-fg-300">{slug || "…"}</span>
              {!slugLocked ? <span className="text-fg-700"> · follows title</span> : null}
            </span>
          }
        >
          <div className="flex gap-2">
            <Input
              id={`${ids}-slug`}
              className="font-mono text-[13px]"
              placeholder="auto-generated-from-title"
              {...register("slug", { onChange: () => onSlugLockedChange(true) })}
            />
            <button
              type="button"
              onClick={regenerateSlug}
              title="Regenerate from title"
              aria-label="Regenerate slug from title"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-line-700 text-fg-300 transition-colors hover:border-line-600 hover:text-fg-50"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>
        </Field>

        <div className="space-y-1.5 md:col-span-2">
          <LabelWithCounter
            htmlFor={`${ids}-short`}
            label="Short description"
            value={shortDescription}
            max={160}
          />
          <AutoTextarea
            id={`${ids}-short`}
            rows={2}
            placeholder="One or two sentences used on cards and in search results."
            aria-invalid={errors.short_description ? true : undefined}
            {...register("short_description")}
          />
          {errors.short_description?.message ? (
            <p role="alert" className="text-xs text-crimson-400">
              {errors.short_description.message}
            </p>
          ) : (
            <Hint>Shown on project cards, listings and as the fallback meta description.</Hint>
          )}
        </div>

        <Field
          label="Full description"
          htmlFor={`${ids}-full`}
          errors={errors.full_description?.message}
          className="md:col-span-2"
          hint="Intro paragraph(s) at the top of the case study."
        >
          <AutoTextarea id={`${ids}-full`} rows={4} {...register("full_description")} />
        </Field>

        <Field
          label="Category"
          htmlFor={`${ids}-category`}
          errors={errors.category?.message}
          hint="Free text; pick a suggestion to keep labels consistent."
        >
          <Input
            id={`${ids}-category`}
            list={`${ids}-categories`}
            placeholder="Fintech / Wealth Management"
            {...register("category")}
          />
          <datalist id={`${ids}-categories`}>
            {CATEGORY_SUGGESTIONS.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </Field>

        <Field
          label="Project type"
          htmlFor={`${ids}-type`}
          errors={errors.project_type?.message}
          hint="e.g. Web application, Mobile app, API integration"
        >
          <Input id={`${ids}-type`} {...register("project_type")} />
        </Field>

        <Field
          label="Client"
          htmlFor={`${ids}-client`}
          errors={errors.client?.message}
          hint="Hidden or replaced when the project is confidential."
        >
          <Input id={`${ids}-client`} {...register("client")} />
        </Field>

        <Field
          label="Company"
          htmlFor={`${ids}-company`}
          errors={errors.company?.message}
          hint="Employer or agency you built it with."
        >
          <Input id={`${ids}-company`} {...register("company")} />
        </Field>

        <Field
          label="Role"
          htmlFor={`${ids}-role`}
          errors={errors.role?.message}
          className="md:col-span-2"
          hint="e.g. Full-stack developer, Lead mobile engineer"
        >
          <Input id={`${ids}-role`} {...register("role")} />
        </Field>

        <div className="md:col-span-2">
          <Field label="Platforms" htmlFor={`${ids}-platforms`} errors={errors.platforms?.message}>
            <Controller
              control={control}
              name="platforms"
              render={({ field }) => (
                <ChipsInput
                  id={`${ids}-platforms`}
                  value={field.value}
                  onChange={field.onChange}
                  suggestions={PLATFORM_OPTIONS}
                  placeholder="Type and press Enter…"
                />
              )}
            />
          </Field>
        </div>

        <Field label="Start date" htmlFor={`${ids}-start`} errors={errors.start_date?.message}>
          <Input id={`${ids}-start`} type="date" {...register("start_date")} />
        </Field>
        <Field
          label="End date"
          htmlFor={`${ids}-end`}
          errors={errors.end_date?.message}
          hint="Leave empty for ongoing work."
        >
          <Input id={`${ids}-end`} type="date" {...register("end_date")} />
        </Field>

        <Field
          label="Year label"
          htmlFor={`${ids}-year`}
          errors={errors.year_label?.message}
          className="md:col-span-2"
          hint={
            yearLabel
              ? `Shown instead of dates: “${yearLabel}”.`
              : "Optional override shown instead of the dates, e.g. “2024” or “2022 – 2023”."
          }
        >
          <Input
            id={`${ids}-year`}
            placeholder="2024"
            className="max-w-xs"
            {...register("year_label")}
          />
        </Field>
      </div>
    </>
  );
}
