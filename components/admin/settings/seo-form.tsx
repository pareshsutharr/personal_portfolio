"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ExternalLink, FileCode2, Globe, Image as ImageIcon } from "lucide-react";
import { ImageField } from "@/components/admin/image-field";
import {
  FieldGrid,
  StickySaveBar,
  TextField,
  TextareaField,
  useFormValues,
  useScrollToFirstError,
  useUnsavedWarning,
} from "@/components/admin/forms/form-kit";
import { FormSection } from "@/components/ui/field";
import { Panel, PanelBody, PanelHeader } from "@/components/ui/panel";
import { useAction } from "@/hooks/use-action";
import { updateSeoSettings } from "@/lib/actions/settings";
import { formatDateTime } from "@/lib/utils/format";
import type { SeoSettings } from "@/types";

type SeoFormValues = {
  site_title: string;
  title_template: string;
  meta_description: string;
  keywords: string;
  og_title: string;
  og_description: string;
  og_image: string;
  twitter_image: string;
  twitter_handle: string;
  favicon: string;
  google_verification: string;
  canonical_url: string;
};

const s = (v: string | null | undefined) => v ?? "";

function toValues(x: SeoSettings | null): SeoFormValues {
  return {
    site_title: s(x?.site_title),
    title_template: s(x?.title_template) || "%s · Paresh Suthar",
    meta_description: s(x?.meta_description),
    keywords: (x?.keywords ?? []).join(", "),
    og_title: s(x?.og_title),
    og_description: s(x?.og_description),
    og_image: s(x?.og_image),
    twitter_image: s(x?.twitter_image),
    twitter_handle: s(x?.twitter_handle),
    favicon: s(x?.favicon),
    google_verification: s(x?.google_verification),
    canonical_url: s(x?.canonical_url),
  };
}

const GENERATED_FILES = [
  { path: "/sitemap.xml", label: "Sitemap", note: "All public pages and projects" },
  { path: "/robots.txt", label: "Robots", note: "Crawl rules; admin is disallowed" },
  { path: "/opengraph-image", label: "Default OG image", note: "Used when a page has none" },
] as const;

export function SeoForm({ seo, siteUrl }: { seo: SeoSettings | null; siteUrl: string }) {
  const router = useRouter();
  const { values, set, replace, reset, dirty } = useFormValues(toValues(seo));
  const { run, pending, fieldErrors } = useAction(updateSeoSettings);
  const [savedAt, setSavedAt] = React.useState<string | null>(seo?.updated_at ?? null);

  useUnsavedWarning(dirty);
  useScrollToFirstError(fieldErrors);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await run([values], {
      onSuccess: (saved) => {
        replace(toValues(saved));
        setSavedAt(saved.updated_at);
        router.refresh();
      },
    });
  };

  return (
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form onSubmit={onSubmit} noValidate>
        <Panel className="divide-y divide-line-800">
          <div className="px-5 py-6">
            <FormSection
              title="Titles"
              description="The home page uses the site title as-is. Every other page is formatted with the template."
            >
              <TextField
                id="site_title"
                label="Site title"
                required
                value={values.site_title}
                onChange={(v) => set("site_title", v)}
                errors={fieldErrors.site_title}
                hint="Aim for under 60 characters."
              />
              <TextField
                id="title_template"
                label="Title template"
                required
                value={values.title_template}
                onChange={(v) => set("title_template", v)}
                errors={fieldErrors.title_template}
                hint={
                  <>
                    <code className="text-fg-300">%s</code> becomes the page title. Example:{" "}
                    <span className="text-fg-300">
                      {applyTemplate(values.title_template, "Projects")}
                    </span>
                  </>
                }
                mono
              />
            </FormSection>
          </div>

          <div className="px-5 py-6">
            <FormSection
              title="Description & keywords"
              description="Search engines show roughly the first 160 characters of the description."
            >
              <TextareaField
                id="meta_description"
                label="Meta description"
                rows={3}
                max={160}
                value={values.meta_description}
                onChange={(v) => set("meta_description", v)}
                errors={fieldErrors.meta_description}
              />
              <TextField
                id="keywords"
                label="Keywords"
                value={values.keywords}
                onChange={(v) => set("keywords", v)}
                errors={fieldErrors.keywords}
                hint="Comma separated. Low weight for ranking, still useful for your own clarity."
                mono
              />
            </FormSection>
          </div>

          <div className="px-5 py-6">
            <FormSection
              title="Open Graph"
              description="What LinkedIn, Slack, WhatsApp and iMessage show when the site is shared."
            >
              <TextField
                id="og_title"
                label="OG title"
                value={values.og_title}
                onChange={(v) => set("og_title", v)}
                errors={fieldErrors.og_title}
                hint="Falls back to the site title."
              />
              <TextareaField
                id="og_description"
                label="OG description"
                rows={2}
                max={200}
                value={values.og_description}
                onChange={(v) => set("og_description", v)}
                errors={fieldErrors.og_description}
                hint="Falls back to the meta description."
              />
              <ImageField
                label="OG image"
                folder="og"
                aspect="wide"
                value={values.og_image}
                onChange={(url) => set("og_image", url ?? "")}
                errors={fieldErrors.og_image}
                hint="1200×630 PNG or JPEG. Leave empty to use the generated /opengraph-image."
              />
            </FormSection>
          </div>

          <div className="px-5 py-6">
            <FormSection title="X / Twitter" description="Optional overrides for the X card.">
              <TextField
                id="twitter_handle"
                label="Handle"
                value={values.twitter_handle}
                onChange={(v) => set("twitter_handle", v)}
                errors={fieldErrors.twitter_handle}
                placeholder="@handle"
                mono
                className="sm:max-w-xs"
              />
              <ImageField
                label="Twitter image"
                folder="og"
                aspect="wide"
                value={values.twitter_image}
                onChange={(url) => set("twitter_image", url ?? "")}
                errors={fieldErrors.twitter_image}
                hint="Falls back to the OG image."
              />
            </FormSection>
          </div>

          <div className="px-5 py-6">
            <FormSection
              title="Technical"
              description="Canonical domain, favicon and search-console verification."
            >
              <TextField
                id="canonical_url"
                label="Canonical URL"
                type="url"
                value={values.canonical_url}
                onChange={(v) => set("canonical_url", v)}
                errors={fieldErrors.canonical_url}
                hint={`Production origin, no trailing path. Falls back to ${siteUrl || "NEXT_PUBLIC_SITE_URL"}.`}
                placeholder="https://pareshsuthar.dev"
                mono
              />
              <FieldGrid>
                <ImageField
                  label="Favicon"
                  folder="logos"
                  aspect="square"
                  value={values.favicon}
                  onChange={(url) => set("favicon", url ?? "")}
                  errors={fieldErrors.favicon}
                  hint="Overrides the favicon from site settings when set."
                />
                <TextField
                  id="google_verification"
                  label="Google verification"
                  value={values.google_verification}
                  onChange={(v) => set("google_verification", v)}
                  errors={fieldErrors.google_verification}
                  hint="The content value from Search Console's HTML tag method."
                  mono
                />
              </FieldGrid>
            </FormSection>
          </div>

          <StickySaveBar
            dirty={dirty}
            pending={pending}
            onDiscard={reset}
            meta={savedAt ? `Last saved ${formatDateTime(savedAt)}` : undefined}
          />
        </Panel>
      </form>

      <aside className="space-y-6 xl:sticky xl:top-6">
        <SeoPreview values={values} siteUrl={siteUrl} />
        <Panel>
          <PanelHeader
            title="Generated files"
            description="Built from these settings on every deploy."
          />
          <ul className="divide-y divide-line-800">
            {GENERATED_FILES.map((f) => (
              <li key={f.path}>
                <a
                  href={f.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface-800/60"
                >
                  <FileCode2 className="h-4 w-4 shrink-0 text-fg-500" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[13px] text-fg-100">{f.path}</span>
                    <span className="block text-xs text-fg-500">{f.note}</span>
                  </span>
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-fg-500 group-hover:text-fg-100" />
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      </aside>
    </div>
  );
}

function applyTemplate(template: string, title: string) {
  return template.includes("%s") ? template.replace("%s", title) : `${title} ${template}`.trim();
}

function hostOf(url: string, fallback: string) {
  for (const candidate of [url, fallback]) {
    if (!candidate) continue;
    try {
      return new URL(candidate).host;
    } catch {
      // not a URL yet; try the next candidate
    }
  }
  return "yourdomain.com";
}

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

/** Google-style snippet + social card, built from the live form values. */
function SeoPreview({ values, siteUrl }: { values: SeoFormValues; siteUrl: string }) {
  const host = hostOf(values.canonical_url, siteUrl);
  const title = values.site_title || "Site title";
  const description = values.meta_description || "Add a meta description to control this text.";
  const ogTitle = values.og_title || title;
  const ogDescription = values.og_description || values.meta_description || "";
  const image = values.og_image;

  return (
    <Panel>
      <PanelHeader
        title="Preview"
        description="Approximate. Platforms crop and truncate differently."
      />
      <PanelBody className="space-y-5">
        <div>
          <p className="mb-2 label-mono">Search result</p>
          <div className="rounded-sm border border-line-800 bg-bg-900 p-3">
            <div className="flex items-center gap-2">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-700">
                <Globe className="h-3 w-3 text-fg-300" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs leading-tight text-fg-100">{host}</span>
                <span className="block font-mono text-[10px] leading-tight text-fg-500">
                  https://{host}
                </span>
              </span>
            </div>
            <p className="mt-1.5 text-[15px] leading-snug text-[#8ab4f8]">{truncate(title, 60)}</p>
            <p className="mt-1 text-xs leading-relaxed text-fg-300">{truncate(description, 160)}</p>
          </div>
        </div>

        <div>
          <p className="mb-2 label-mono">Social card</p>
          <div className="overflow-hidden rounded-sm border border-line-800 bg-bg-900">
            <div className="relative aspect-[1.91/1] w-full bg-surface-800">
              {image ? (
                <Image src={image} alt="" fill sizes="360px" className="object-cover" unoptimized />
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-1 text-xs text-fg-500">
                  <ImageIcon className="h-4 w-4" />
                  <span className="font-mono text-[10px]">
                    1200 × 630 · generated image is used
                  </span>
                </div>
              )}
            </div>
            <div className="space-y-0.5 p-3">
              <p className="font-mono text-[10px] tracking-wider text-fg-500 uppercase">{host}</p>
              <p className="truncate text-sm font-medium text-fg-50">{ogTitle}</p>
              {ogDescription ? (
                <p className="line-clamp-2 text-xs leading-relaxed text-fg-300">{ogDescription}</p>
              ) : null}
              {values.twitter_handle ? (
                <p className="pt-1 font-mono text-[10px] text-fg-500">{values.twitter_handle}</p>
              ) : null}
            </div>
          </div>
        </div>
      </PanelBody>
    </Panel>
  );
}
