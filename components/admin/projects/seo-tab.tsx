"use client";

import * as React from "react";
import { Controller, useFormContext } from "react-hook-form";
import { ImageField } from "@/components/admin/image-field";
import { Field, Hint } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AutoTextarea, LabelWithCounter } from "./editor-fields";
import type { ProjectFormValues } from "./editor-types";

const TITLE_MAX = 60;
const DESC_MAX = 160;

export function SeoTab({ siteUrl }: { siteUrl: string }) {
  const {
    register,
    control,
    watch,
    formState: { errors },
  } = useFormContext<ProjectFormValues>();
  const ids = React.useId();

  const [title, slug, shortDescription, metaTitle, metaDescription] = watch([
    "title",
    "slug",
    "short_description",
    "meta_title",
    "meta_description",
  ]);

  const previewTitle = metaTitle || title || "Project title";
  const previewDescription =
    metaDescription ||
    shortDescription ||
    "Add a short description or meta description to see it here.";
  const host = siteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "") || "yourdomain.com";
  const previewUrl = `${host} › projects › ${slug || "slug"}`;

  return (
    <>
      <div className="grid gap-5 lg:grid-cols-[1fr_minmax(0,380px)]">
        <div className="space-y-5">
          <div className="space-y-1.5">
            <LabelWithCounter
              htmlFor={`${ids}-meta-title`}
              label="Meta title"
              value={metaTitle}
              max={TITLE_MAX}
            />
            <Input
              id={`${ids}-meta-title`}
              placeholder={title || "Defaults to the project title"}
              {...register("meta_title")}
            />
            {errors.meta_title?.message ? (
              <p role="alert" className="text-xs text-crimson-400">
                {errors.meta_title.message}
              </p>
            ) : (
              <Hint>
                Keep under {TITLE_MAX} characters. The site title template is appended
                automatically.
              </Hint>
            )}
          </div>

          <div className="space-y-1.5">
            <LabelWithCounter
              htmlFor={`${ids}-meta-desc`}
              label="Meta description"
              value={metaDescription}
              max={DESC_MAX}
            />
            <AutoTextarea
              id={`${ids}-meta-desc`}
              rows={3}
              placeholder={shortDescription || "Defaults to the short description"}
              {...register("meta_description")}
            />
            {errors.meta_description?.message ? (
              <p role="alert" className="text-xs text-crimson-400">
                {errors.meta_description.message}
              </p>
            ) : (
              <Hint>Search engines truncate around {DESC_MAX} characters.</Hint>
            )}
          </div>

          <Field
            label="Canonical URL"
            htmlFor={`${ids}-canonical`}
            hint="Only when this case study is also published elsewhere (e.g. a client blog)."
            errors={errors.canonical_url?.message}
          >
            <Input
              id={`${ids}-canonical`}
              type="url"
              placeholder="https://"
              className="font-mono text-[13px]"
              {...register("canonical_url")}
            />
          </Field>

          <Controller
            control={control}
            name="og_image"
            render={({ field }) => (
              <ImageField
                label="Social share image"
                value={field.value || null}
                onChange={(url) => field.onChange(url ?? "")}
                folder="og"
                aspect="wide"
                hint="1200×630 recommended. Falls back to the cover image when empty."
                errors={errors.og_image?.message}
              />
            )}
          />
        </div>

        <aside className="space-y-2 lg:sticky lg:top-24 lg:self-start">
          <p className="font-mono text-[10px] tracking-wider text-fg-500 uppercase">
            Search preview
          </p>
          <div className="rounded-md border border-line-800 bg-bg-900 p-4">
            <p className="truncate text-[12px] text-fg-500">{previewUrl}</p>
            <p className="mt-1 truncate text-[18px] leading-snug text-[#8ab4f8]">
              {truncate(previewTitle, TITLE_MAX)}
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-fg-300">
              {truncate(previewDescription, DESC_MAX)}
            </p>
          </div>
          <Hint>
            Approximation of a Google result. Actual rendering varies by device and query.
          </Hint>
        </aside>
      </div>
    </>
  );
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;
}
