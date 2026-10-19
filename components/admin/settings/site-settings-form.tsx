"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CircleCheck, Info } from "lucide-react";
import { ImageField } from "@/components/admin/image-field";
import {
  FieldGrid,
  FormNotice,
  SelectField,
  StickySaveBar,
  SwitchField,
  TextField,
  TextareaField,
  useFormValues,
  useScrollToFirstError,
  useUnsavedWarning,
} from "@/components/admin/forms/form-kit";
import { Badge } from "@/components/ui/badge";
import { FormSection } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { useAction } from "@/hooks/use-action";
import { updateSiteSettings } from "@/lib/actions/settings";
import { formatDateTime } from "@/lib/utils/format";
import type { SiteSettings } from "@/types";

type ThemeAccent = "ember" | "crimson" | "amber";

type SiteSettingsFormValues = {
  site_name: string;
  logo_url: string;
  favicon_url: string;
  contact_email: string;
  contact_phone: string;
  location: string;
  footer_tagline: string;
  copyright_text: string;
  cta_heading: string;
  cta_subheading: string;
  cta_button_text: string;
  ga_measurement_id: string;
  vercel_analytics_enabled: boolean;
  notification_email: string;
  show_now_page: boolean;
  theme_accent: ThemeAccent;
};

const ACCENTS: readonly { value: ThemeAccent; label: string; swatch: string }[] = [
  { value: "ember", label: "Ember (burnt orange)", swatch: "bg-ember-500" },
  { value: "crimson", label: "Crimson (deep red)", swatch: "bg-crimson-500" },
  { value: "amber", label: "Amber", swatch: "bg-amber-400" },
];

const s = (v: string | null | undefined) => v ?? "";
const isAccent = (v: string | null | undefined): v is ThemeAccent =>
  v === "ember" || v === "crimson" || v === "amber";

function toValues(x: SiteSettings | null): SiteSettingsFormValues {
  return {
    site_name: s(x?.site_name),
    logo_url: s(x?.logo_url),
    favicon_url: s(x?.favicon_url),
    contact_email: s(x?.contact_email),
    contact_phone: s(x?.contact_phone),
    location: s(x?.location),
    footer_tagline: s(x?.footer_tagline),
    copyright_text: s(x?.copyright_text),
    cta_heading: s(x?.cta_heading),
    cta_subheading: s(x?.cta_subheading),
    cta_button_text: s(x?.cta_button_text),
    ga_measurement_id: s(x?.ga_measurement_id),
    vercel_analytics_enabled: x?.vercel_analytics_enabled ?? false,
    notification_email: s(x?.notification_email),
    show_now_page: x?.show_now_page ?? false,
    theme_accent: isAccent(x?.theme_accent) ? x.theme_accent : "ember",
  };
}

export function SiteSettingsForm({
  settings,
  emailConfigured,
}: {
  settings: SiteSettings | null;
  /** Whether RESEND_API_KEY is set on the server. Never the key itself. */
  emailConfigured: boolean;
}) {
  const router = useRouter();
  const { values, set, replace, reset, dirty } = useFormValues(toValues(settings));
  const { run, pending, fieldErrors } = useAction(updateSiteSettings);
  const [savedAt, setSavedAt] = React.useState<string | null>(settings?.updated_at ?? null);

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

  const year = new Date().getFullYear();
  const accent = ACCENTS.find((a) => a.value === values.theme_accent) ?? ACCENTS[0];

  return (
    <form onSubmit={onSubmit} noValidate>
      <Panel className="divide-y divide-line-800">
        <div className="px-5 py-6">
          <FormSection
            title="Brand"
            description="Name and marks used in the nav, footer and browser tab."
          >
            <TextField
              id="site_name"
              label="Site name"
              required
              value={values.site_name}
              onChange={(v) => set("site_name", v)}
              errors={fieldErrors.site_name}
            />
            <FieldGrid>
              <ImageField
                label="Logo"
                folder="logos"
                aspect="video"
                value={values.logo_url}
                onChange={(url) => set("logo_url", url ?? "")}
                errors={fieldErrors.logo_url}
                hint="SVG or PNG with transparency. Falls back to the site name."
              />
              <ImageField
                label="Favicon"
                folder="logos"
                aspect="square"
                value={values.favicon_url}
                onChange={(url) => set("favicon_url", url ?? "")}
                errors={fieldErrors.favicon_url}
                hint="Square, at least 512×512."
              />
            </FieldGrid>
          </FormSection>
        </div>

        <div className="px-5 py-6">
          <FormSection
            title="Contact"
            description="Public contact details shown in the footer and on /contact."
          >
            <FieldGrid>
              <TextField
                id="contact_email"
                label="Contact email"
                type="email"
                value={values.contact_email}
                onChange={(v) => set("contact_email", v)}
                errors={fieldErrors.contact_email}
              />
              <TextField
                id="contact_phone"
                label="Contact phone"
                type="tel"
                value={values.contact_phone}
                onChange={(v) => set("contact_phone", v)}
                errors={fieldErrors.contact_phone}
              />
            </FieldGrid>
            <TextField
              id="location"
              label="Location"
              value={values.location}
              onChange={(v) => set("location", v)}
              errors={fieldErrors.location}
              placeholder="Ahmedabad, India"
            />
          </FormSection>
        </div>

        <div className="px-5 py-6">
          <FormSection
            title="Footer"
            description="Tagline and copyright line at the bottom of every page."
          >
            <TextField
              id="footer_tagline"
              label="Footer tagline"
              value={values.footer_tagline}
              onChange={(v) => set("footer_tagline", v)}
              errors={fieldErrors.footer_tagline}
            />
            <TextField
              id="copyright_text"
              label="Copyright text"
              value={values.copyright_text}
              onChange={(v) => set("copyright_text", v)}
              errors={fieldErrors.copyright_text}
              hint={
                <>
                  <code className="text-fg-300">{"{year}"}</code> is replaced automatically.
                  {values.copyright_text ? (
                    <>
                      {" "}
                      Preview:{" "}
                      <span className="text-fg-300">
                        {values.copyright_text.replaceAll("{year}", String(year))}
                      </span>
                    </>
                  ) : null}
                </>
              }
              placeholder="© {year} Paresh Suthar"
            />
          </FormSection>
        </div>

        <div className="px-5 py-6">
          <FormSection
            title="Call to action"
            description="The closing CTA block that appears above the footer on most pages."
          >
            <TextField
              id="cta_heading"
              label="Heading"
              value={values.cta_heading}
              onChange={(v) => set("cta_heading", v)}
              errors={fieldErrors.cta_heading}
            />
            <TextareaField
              id="cta_subheading"
              label="Subheading"
              rows={2}
              max={200}
              value={values.cta_subheading}
              onChange={(v) => set("cta_subheading", v)}
              errors={fieldErrors.cta_subheading}
            />
            <TextField
              id="cta_button_text"
              label="Button text"
              value={values.cta_button_text}
              onChange={(v) => set("cta_button_text", v)}
              errors={fieldErrors.cta_button_text}
              placeholder="Start a project"
              className="sm:max-w-xs"
            />
          </FormSection>
        </div>

        <div className="px-5 py-6">
          <FormSection
            title="Analytics"
            description="Both are optional and load only on the public site."
          >
            <TextField
              id="ga_measurement_id"
              label="Google Analytics measurement ID"
              value={values.ga_measurement_id}
              onChange={(v) => set("ga_measurement_id", v)}
              errors={fieldErrors.ga_measurement_id}
              hint="Looks like G-XXXXXXXXXX. Leave empty to disable."
              placeholder="G-XXXXXXXXXX"
              mono
              className="sm:max-w-xs"
            />
            <SwitchField
              id="vercel_analytics_enabled"
              label="Vercel Analytics"
              description="Loads @vercel/analytics on public pages."
              checked={values.vercel_analytics_enabled}
              onCheckedChange={(v) => set("vercel_analytics_enabled", v)}
              errors={fieldErrors.vercel_analytics_enabled}
            />
          </FormSection>
        </div>

        <div className="px-5 py-6">
          <FormSection
            title="Notifications"
            description="Where new contact-form messages are forwarded."
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-fg-300">Email notifications:</span>
              {emailConfigured ? (
                <Badge tone="success">
                  <CircleCheck className="h-3 w-3" /> Configured
                </Badge>
              ) : (
                <Badge tone="amber">Not configured</Badge>
              )}
            </div>
            <TextField
              id="notification_email"
              label="Notification email"
              type="email"
              value={values.notification_email}
              onChange={(v) => set("notification_email", v)}
              errors={fieldErrors.notification_email}
              hint="Messages are always stored in the inbox. Emails only send when RESEND_API_KEY is configured on the server."
            />
            {!emailConfigured ? (
              <FormNotice icon={Info}>
                Add <code className="text-fg-100">RESEND_API_KEY</code> to the server environment to
                enable forwarding. Nothing is sent until then.
              </FormNotice>
            ) : null}
          </FormSection>
        </div>

        <div className="px-5 py-6">
          <FormSection
            title="Pages & theme"
            description="Toggle optional pages and pick the accent colour."
          >
            <SwitchField
              id="show_now_page"
              label="Show the /now page"
              description="Adds /now to the navigation and sitemap. The page itself also needs its own visibility on."
              checked={values.show_now_page}
              onCheckedChange={(v) => set("show_now_page", v)}
              errors={fieldErrors.show_now_page}
            />
            <div className="flex items-end gap-3">
              <SelectField
                id="theme_accent"
                label="Accent colour"
                value={values.theme_accent}
                onChange={(v) => set("theme_accent", v)}
                options={ACCENTS}
                errors={fieldErrors.theme_accent}
                className="w-full sm:max-w-xs"
              />
              <span
                aria-hidden
                className={`mb-2.5 inline-block h-5 w-5 shrink-0 rounded-sm ${accent.swatch}`}
              />
            </div>
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
  );
}
