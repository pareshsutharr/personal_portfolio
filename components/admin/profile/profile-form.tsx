"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, FileText, Image as ImageIcon, Sparkles, Type, User } from "lucide-react";
import { ImageField } from "@/components/admin/image-field";
import {
  FieldGrid,
  SelectField,
  StickySaveBar,
  TextField,
  TextareaField,
  useFormValues,
  useScrollToFirstError,
  useUnsavedWarning,
} from "@/components/admin/forms/form-kit";
import { FormSection } from "@/components/ui/field";
import { Panel } from "@/components/ui/panel";
import { useAction } from "@/hooks/use-action";
import { updateProfile } from "@/lib/actions/profile";
import { cn } from "@/lib/utils/cn";
import { formatDateTime } from "@/lib/utils/format";
import { AVAILABILITY_LABELS, type AvailabilityStatus, type Profile } from "@/types";

type ProfileFormValues = {
  full_name: string;
  professional_title: string;
  location: string;
  email: string;
  phone: string;
  years_experience: string;
  profile_photo: string;
  hero_photo: string;
  about_photo: string;
  hero_kicker: string;
  hero_line_1: string;
  hero_line_2: string;
  hero_tagline: string;
  hero_keywords: string;
  cta_primary_text: string;
  cta_secondary_text: string;
  availability_status: AvailabilityStatus;
  availability_text: string;
  short_bio: string;
  long_bio: string;
  personal_intro: string;
  philosophy: string;
  career_summary: string;
  current_focus: string;
  what_i_build: string;
  looking_for: string;
  resume_url: string;
};

const s = (v: string | null | undefined) => v ?? "";

function toValues(p: Profile | null): ProfileFormValues {
  return {
    full_name: s(p?.full_name),
    professional_title: s(p?.professional_title),
    location: s(p?.location),
    email: s(p?.email),
    phone: s(p?.phone),
    years_experience: s(p?.years_experience),
    profile_photo: s(p?.profile_photo),
    hero_photo: s(p?.hero_photo),
    about_photo: s(p?.about_photo),
    hero_kicker: s(p?.hero_kicker),
    hero_line_1: s(p?.hero_line_1),
    hero_line_2: s(p?.hero_line_2),
    hero_tagline: s(p?.hero_tagline),
    hero_keywords: (p?.hero_keywords ?? []).join(", "),
    cta_primary_text: s(p?.cta_primary_text),
    cta_secondary_text: s(p?.cta_secondary_text),
    availability_status: p?.availability_status ?? "available",
    availability_text: s(p?.availability_text),
    short_bio: s(p?.short_bio),
    long_bio: s(p?.long_bio),
    personal_intro: s(p?.personal_intro),
    philosophy: s(p?.philosophy),
    career_summary: s(p?.career_summary),
    current_focus: s(p?.current_focus),
    what_i_build: s(p?.what_i_build),
    looking_for: s(p?.looking_for),
    resume_url: s(p?.resume_url),
  };
}

const SECTIONS = [
  { id: "identity", label: "Identity", icon: User },
  { id: "photos", label: "Photos", icon: ImageIcon },
  { id: "hero", label: "Hero", icon: Sparkles },
  { id: "availability", label: "Availability", icon: BadgeCheck },
  { id: "about", label: "About", icon: Type },
  { id: "resume", label: "Résumé", icon: FileText },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

const AVAILABILITY_OPTIONS = (Object.keys(AVAILABILITY_LABELS) as AvailabilityStatus[]).map(
  (value) => ({ value, label: AVAILABILITY_LABELS[value] }),
);

export function ProfileForm({ profile }: { profile: Profile | null }) {
  const router = useRouter();
  const { values, set, replace, reset, dirty } = useFormValues(toValues(profile));
  const { run, pending, fieldErrors } = useAction(updateProfile);
  const [savedAt, setSavedAt] = React.useState<string | null>(profile?.updated_at ?? null);
  const active = useActiveSection(SECTIONS.map((x) => x.id));

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
    <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
      <SectionNav active={active} />

      <form onSubmit={onSubmit} noValidate>
        <Panel className="divide-y divide-line-800">
          {/* Identity ------------------------------------------------------- */}
          <Section id="identity">
            <FormSection
              title="Identity"
              description="Your name and title are used in the header, metadata and the about page."
            >
              <FieldGrid>
                <TextField
                  id="full_name"
                  label="Full name"
                  required
                  value={values.full_name}
                  onChange={(v) => set("full_name", v)}
                  errors={fieldErrors.full_name}
                  autoComplete="name"
                />
                <TextField
                  id="professional_title"
                  label="Professional title"
                  required
                  value={values.professional_title}
                  onChange={(v) => set("professional_title", v)}
                  errors={fieldErrors.professional_title}
                  placeholder="Full-stack developer"
                />
                <TextField
                  id="location"
                  label="Location"
                  value={values.location}
                  onChange={(v) => set("location", v)}
                  errors={fieldErrors.location}
                  placeholder="Ahmedabad, India"
                />
                <TextField
                  id="years_experience"
                  label="Years of experience"
                  value={values.years_experience}
                  onChange={(v) => set("years_experience", v)}
                  errors={fieldErrors.years_experience}
                  hint='Free text, e.g. "3+". Leave empty to hide.'
                  placeholder="3+"
                />
                <TextField
                  id="email"
                  label="Email"
                  type="email"
                  value={values.email}
                  onChange={(v) => set("email", v)}
                  errors={fieldErrors.email}
                  hint="Shown on the contact page and in the footer."
                  autoComplete="email"
                />
                <TextField
                  id="phone"
                  label="Phone"
                  type="tel"
                  value={values.phone}
                  onChange={(v) => set("phone", v)}
                  errors={fieldErrors.phone}
                  autoComplete="tel"
                />
              </FieldGrid>
            </FormSection>
          </Section>

          {/* Photos --------------------------------------------------------- */}
          <Section id="photos">
            <FormSection
              title="Photos"
              description="Upload once, reuse from the media library. Blocks without a photo are hidden on the public site."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                <ImageField
                  label="Profile photo"
                  folder="profile"
                  aspect="square"
                  value={values.profile_photo}
                  onChange={(url) => set("profile_photo", url ?? "")}
                  errors={fieldErrors.profile_photo}
                  hint="Square. Used in the nav and cards."
                />
                <ImageField
                  label="Hero photo"
                  folder="profile"
                  aspect="portrait"
                  value={values.hero_photo}
                  onChange={(url) => set("hero_photo", url ?? "")}
                  errors={fieldErrors.hero_photo}
                  hint="Portrait. Home page hero."
                />
                <ImageField
                  label="About photo"
                  folder="profile"
                  aspect="portrait"
                  value={values.about_photo}
                  onChange={(url) => set("about_photo", url ?? "")}
                  errors={fieldErrors.about_photo}
                  hint="Portrait. About page."
                />
              </div>
            </FormSection>
          </Section>

          {/* Hero ----------------------------------------------------------- */}
          <Section id="hero">
            <FormSection
              title="Hero"
              description="The first thing visitors read. Keep lines short; the display type is large."
            >
              <TextField
                id="hero_kicker"
                label="Kicker"
                value={values.hero_kicker}
                onChange={(v) => set("hero_kicker", v)}
                errors={fieldErrors.hero_kicker}
                hint="Small mono label above the headline."
                placeholder="Full-stack developer · India"
              />
              <FieldGrid>
                <TextField
                  id="hero_line_1"
                  label="Headline line 1"
                  value={values.hero_line_1}
                  onChange={(v) => set("hero_line_1", v)}
                  errors={fieldErrors.hero_line_1}
                />
                <TextField
                  id="hero_line_2"
                  label="Headline line 2"
                  value={values.hero_line_2}
                  onChange={(v) => set("hero_line_2", v)}
                  errors={fieldErrors.hero_line_2}
                />
              </FieldGrid>
              <TextareaField
                id="hero_tagline"
                label="Tagline"
                rows={2}
                max={180}
                value={values.hero_tagline}
                onChange={(v) => set("hero_tagline", v)}
                errors={fieldErrors.hero_tagline}
                hint="One or two sentences under the headline."
              />
              <TextField
                id="hero_keywords"
                label="Keywords"
                value={values.hero_keywords}
                onChange={(v) => set("hero_keywords", v)}
                errors={fieldErrors.hero_keywords}
                hint="Comma separated. Rendered as a ticker / tag row in the hero."
                placeholder="Next.js, Laravel, Flutter, Fintech"
                mono
              />
              <FieldGrid>
                <TextField
                  id="cta_primary_text"
                  label="Primary button"
                  value={values.cta_primary_text}
                  onChange={(v) => set("cta_primary_text", v)}
                  errors={fieldErrors.cta_primary_text}
                  placeholder="View projects"
                />
                <TextField
                  id="cta_secondary_text"
                  label="Secondary button"
                  value={values.cta_secondary_text}
                  onChange={(v) => set("cta_secondary_text", v)}
                  errors={fieldErrors.cta_secondary_text}
                  placeholder="Get in touch"
                />
              </FieldGrid>
            </FormSection>
          </Section>

          {/* Availability --------------------------------------------------- */}
          <Section id="availability">
            <FormSection
              title="Availability"
              description="Drives the status dot in the hero and footer."
            >
              <FieldGrid>
                <SelectField
                  id="availability_status"
                  label="Status"
                  value={values.availability_status}
                  onChange={(v) => set("availability_status", v)}
                  options={AVAILABILITY_OPTIONS}
                  errors={fieldErrors.availability_status}
                />
                <TextField
                  id="availability_text"
                  label="Status text"
                  value={values.availability_text}
                  onChange={(v) => set("availability_text", v)}
                  errors={fieldErrors.availability_text}
                  hint="Optional override shown next to the dot."
                  placeholder="Booking from November"
                />
              </FieldGrid>
            </FormSection>
          </Section>

          {/* About ---------------------------------------------------------- */}
          <Section id="about">
            <FormSection
              title="About"
              description="Short, concrete, technical. Empty fields hide their block on the public site."
            >
              <TextareaField
                id="short_bio"
                label="Short bio"
                rows={3}
                max={240}
                value={values.short_bio}
                onChange={(v) => set("short_bio", v)}
                errors={fieldErrors.short_bio}
                hint="Cards, metadata and the home page intro."
              />
              <TextareaField
                id="long_bio"
                label="Long bio"
                rows={6}
                value={values.long_bio}
                onChange={(v) => set("long_bio", v)}
                errors={fieldErrors.long_bio}
                hint="Full about-page narrative. Blank lines become paragraphs."
              />
              <TextareaField
                id="personal_intro"
                label="Personal intro"
                rows={3}
                max={300}
                value={values.personal_intro}
                onChange={(v) => set("personal_intro", v)}
                errors={fieldErrors.personal_intro}
                hint="First-person opener for the about page."
              />
              <TextareaField
                id="philosophy"
                label="Philosophy"
                rows={3}
                max={300}
                value={values.philosophy}
                onChange={(v) => set("philosophy", v)}
                errors={fieldErrors.philosophy}
                hint="How you approach building software."
              />
              <TextareaField
                id="career_summary"
                label="Career summary"
                rows={4}
                value={values.career_summary}
                onChange={(v) => set("career_summary", v)}
                errors={fieldErrors.career_summary}
                hint="Sits above the experience timeline."
              />
              <TextareaField
                id="current_focus"
                label="Current focus"
                rows={3}
                max={300}
                value={values.current_focus}
                onChange={(v) => set("current_focus", v)}
                errors={fieldErrors.current_focus}
              />
              <TextareaField
                id="what_i_build"
                label="What I build"
                rows={3}
                max={300}
                value={values.what_i_build}
                onChange={(v) => set("what_i_build", v)}
                errors={fieldErrors.what_i_build}
                hint="Products and systems you specialise in."
              />
              <TextareaField
                id="looking_for"
                label="Looking for"
                rows={3}
                max={300}
                value={values.looking_for}
                onChange={(v) => set("looking_for", v)}
                errors={fieldErrors.looking_for}
                hint="Kind of work or roles you want next."
              />
            </FormSection>
          </Section>

          {/* Résumé --------------------------------------------------------- */}
          <Section id="resume">
            <FormSection
              title="Résumé"
              description="PDF only. Linked from the hero and the about page when set."
            >
              <ImageField
                label="Résumé (PDF)"
                folder="resume"
                accept="pdf"
                value={values.resume_url}
                onChange={(url) => set("resume_url", url ?? "")}
                errors={fieldErrors.resume_url}
                hint="Up to 10 MB."
              />
            </FormSection>
          </Section>

          <StickySaveBar
            dirty={dirty}
            pending={pending}
            onDiscard={reset}
            meta={savedAt ? `Last saved ${formatDateTime(savedAt)}` : undefined}
          />
        </Panel>
      </form>
    </div>
  );
}

function Section({ id, children }: { id: SectionId; children: React.ReactNode }) {
  return (
    <div id={id} className="scroll-mt-24 px-5 py-6">
      {children}
    </div>
  );
}

function SectionNav({ active }: { active: SectionId }) {
  return (
    <nav
      aria-label="Profile sections"
      className="-mx-4 no-scrollbar flex gap-1 overflow-x-auto px-4 lg:sticky lg:top-6 lg:mx-0 lg:block lg:space-y-0.5 lg:self-start lg:px-0"
    >
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const isActive = id === active;
        return (
          <a
            key={id}
            href={`#${id}`}
            aria-current={isActive ? "true" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-sm px-2.5 py-1.5 text-sm whitespace-nowrap transition-colors",
              isActive
                ? "bg-surface-800 text-fg-50"
                : "text-fg-500 hover:bg-surface-800/60 hover:text-fg-100",
            )}
          >
            <Icon className={cn("h-3.5 w-3.5", isActive ? "text-ember-400" : "text-fg-500")} />
            {label}
          </a>
        );
      })}
    </nav>
  );
}

/** Tracks which section is nearest the top of the viewport. */
function useActiveSection(ids: readonly SectionId[]): SectionId {
  const [active, setActive] = React.useState<SectionId>(ids[0]);
  React.useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const visible = new Map<string, number>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) visible.set(entry.target.id, entry.boundingClientRect.top);
          else visible.delete(entry.target.id);
        }
        if (visible.size === 0) return;
        const top = [...visible.entries()].sort((a, b) => a[1] - b[1])[0][0];
        setActive(top as SectionId);
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [ids]);
  return active;
}
