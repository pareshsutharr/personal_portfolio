import { z } from "zod";
import {
  boolFromForm,
  displayOrder,
  lineList,
  optionalDate,
  optionalEmail,
  optionalText,
  optionalUrl,
  requiredText,
  slug,
  textList,
  uuid,
} from "./common";

// -----------------------------------------------------------------------------
// Profile
// -----------------------------------------------------------------------------
export const profileSchema = z.object({
  full_name: requiredText("Name", 120),
  professional_title: requiredText("Title", 160),
  short_bio: optionalText,
  long_bio: optionalText,
  personal_intro: optionalText,
  philosophy: optionalText,
  career_summary: optionalText,
  current_focus: optionalText,
  what_i_build: optionalText,
  looking_for: optionalText,
  location: optionalText,
  email: optionalEmail,
  phone: optionalText,
  profile_photo: optionalUrl,
  hero_photo: optionalUrl,
  about_photo: optionalUrl,
  resume_url: optionalUrl,
  availability_status: z.enum([
    "available",
    "selected_projects",
    "open_to_opportunities",
    "not_available",
  ]),
  availability_text: optionalText,
  years_experience: optionalText,
  hero_kicker: optionalText,
  hero_line_1: optionalText,
  hero_line_2: optionalText,
  hero_tagline: optionalText,
  hero_keywords: textList,
  cta_primary_text: optionalText,
  cta_secondary_text: optionalText,
});
export type ProfileInput = z.infer<typeof profileSchema>;

// -----------------------------------------------------------------------------
// Site + SEO settings
// -----------------------------------------------------------------------------
export const siteSettingsSchema = z.object({
  site_name: requiredText("Site name", 120),
  logo_url: optionalUrl,
  favicon_url: optionalUrl,
  contact_email: optionalEmail,
  contact_phone: optionalText,
  location: optionalText,
  footer_tagline: optionalText,
  copyright_text: optionalText,
  cta_heading: optionalText,
  cta_subheading: optionalText,
  cta_button_text: optionalText,
  ga_measurement_id: optionalText,
  vercel_analytics_enabled: boolFromForm,
  notification_email: optionalEmail,
  show_now_page: boolFromForm,
  theme_accent: z.enum(["ember", "crimson", "amber"]).default("ember"),
});
export type SiteSettingsInput = z.infer<typeof siteSettingsSchema>;

export const seoSettingsSchema = z.object({
  site_title: requiredText("Site title", 120),
  title_template: requiredText("Title template", 120),
  meta_description: optionalText,
  keywords: textList,
  og_title: optionalText,
  og_description: optionalText,
  og_image: optionalUrl,
  twitter_image: optionalUrl,
  twitter_handle: optionalText,
  favicon: optionalUrl,
  google_verification: optionalText,
  canonical_url: optionalUrl,
});
export type SeoSettingsInput = z.infer<typeof seoSettingsSchema>;

// -----------------------------------------------------------------------------
// Social links
// -----------------------------------------------------------------------------
export const SOCIAL_PLATFORMS = [
  "github",
  "linkedin",
  "instagram",
  "x",
  "youtube",
  "portfolio",
  "email",
  "whatsapp",
  "other",
] as const;

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  username: optionalText,
  url: z.string().trim().min(1, "URL is required"),
  icon: optionalText,
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type SocialLinkInput = z.infer<typeof socialLinkSchema>;

// -----------------------------------------------------------------------------
// Client logos
// -----------------------------------------------------------------------------
export const clientLogoSchema = z.object({
  name: requiredText("Name", 80),
  logo_url: optionalUrl,
  url: optionalUrl,
  display_mode: z.enum(["auto", "logo", "name"]).default("auto"),
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type ClientLogoInput = z.infer<typeof clientLogoSchema>;

// -----------------------------------------------------------------------------
// Videos
// -----------------------------------------------------------------------------
export const videoSchema = z.object({
  title: requiredText("Title", 160),
  description: optionalText,
  video_url: z.string().trim().pipe(z.url("Enter the full video link (include https://)")),
  thumbnail_url: optionalUrl,
  company: optionalText,
  playlist: optionalText,
  playlist_url: optionalUrl,
  duration: optionalText,
  published_at: optionalDate,
  experience_id: z
    .union([uuid, z.literal(""), z.null()])
    .transform((v) => (v === "" ? null : v))
    .optional(),
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type VideoInput = z.infer<typeof videoSchema>;

// -----------------------------------------------------------------------------
// Industries, technologies
// -----------------------------------------------------------------------------
export const industrySchema = z.object({
  name: requiredText("Name", 80),
  slug,
  description: optionalText,
  icon: optionalText,
  project_count: z
    .union([z.coerce.number().int().min(0), z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null ? null : v))
    .optional(),
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type IndustryInput = z.infer<typeof industrySchema>;

export const SKILL_CATEGORIES = [
  "frontend",
  "backend",
  "mobile",
  "database",
  "devops",
  "cloud",
  "fintech",
  "healthcare",
  "seo",
  "design",
  "tools",
  "services",
] as const;

export const technologySchema = z.object({
  name: requiredText("Name", 80),
  slug,
  icon: optionalText,
  category: z.enum(SKILL_CATEGORIES),
  color: optionalText,
  description: optionalText,
});
export type TechnologyInput = z.infer<typeof technologySchema>;

// -----------------------------------------------------------------------------
// Projects
// -----------------------------------------------------------------------------
export const projectSchema = z.object({
  title: requiredText("Title", 160),
  slug,
  short_description: optionalText,
  full_description: optionalText,
  category: optionalText,
  industry_id: z
    .union([uuid, z.literal(""), z.null()])
    .transform((v) => (v === "" ? null : v))
    .optional(),
  client_logo_id: z
    .union([uuid, z.literal(""), z.null()])
    .transform((v) => (v === "" ? null : v))
    .optional(),
  client: optionalText,
  company: optionalText,
  role: optionalText,
  project_type: optionalText,
  platforms: textList,
  start_date: optionalDate,
  end_date: optionalDate,
  year_label: optionalText,
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  visibility: z.enum(["public", "private", "unlisted"]).default("public"),
  featured: boolFromForm,
  confidential: boolFromForm,
  confidential_mode: z.enum(["hidden", "summary", "full"]).default("summary"),
  live_url: optionalUrl,
  github_url: optionalUrl,
  app_store_url: optionalUrl,
  play_store_url: optionalUrl,
  cover_image: optionalUrl,
  thumbnail: optionalUrl,
  cover_alt: optionalText,
  cover_frame: z.enum(["none", "browser", "laptop", "phone"]).default("laptop"),
  overview: optionalText,
  problem: optionalText,
  objective: optionalText,
  responsibilities: lineList,
  architecture: optionalText,
  challenge: optionalText,
  solution: optionalText,
  outcome: optionalText,
  impact: optionalText,
  results: optionalText,
  meta_title: optionalText,
  meta_description: optionalText,
  og_image: optionalUrl,
  canonical_url: optionalUrl,
  display_order: displayOrder,
  technology_ids: z.array(uuid).default([]),
  related_project_ids: z.array(uuid).default([]),
});
export type ProjectInput = z.infer<typeof projectSchema>;

export const projectFeatureSchema = z.object({
  project_id: uuid,
  title: requiredText("Title", 120),
  description: optionalText,
  icon: optionalText,
  display_order: displayOrder,
});
export type ProjectFeatureInput = z.infer<typeof projectFeatureSchema>;

export const projectImageSchema = z.object({
  project_id: uuid,
  image_url: z.url("Image URL is required"),
  alt_text: optionalText,
  caption: optionalText,
  type: z
    .enum(["hero", "screenshot", "dashboard", "mobile", "architecture", "gallery"])
    .default("screenshot"),
  display_order: displayOrder,
});
export type ProjectImageInput = z.infer<typeof projectImageSchema>;

// -----------------------------------------------------------------------------
// Experience, education, certifications
// -----------------------------------------------------------------------------
export const experienceSchema = z.object({
  company: requiredText("Company", 160),
  position: requiredText("Position", 160),
  employment_type: z.enum(["full_time", "part_time", "internship", "contract", "freelance"]),
  location: optionalText,
  start_date: optionalDate,
  end_date: optionalDate,
  period_label: optionalText,
  is_current: boolFromForm,
  description: optionalText,
  responsibilities: lineList,
  technologies: textList,
  achievements: lineList,
  company_url: optionalUrl,
  logo: optionalUrl,
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type ExperienceInput = z.infer<typeof experienceSchema>;

export const educationSchema = z.object({
  institution: requiredText("Institution", 160),
  degree: requiredText("Degree", 120),
  field: optionalText,
  start_date: optionalDate,
  end_date: optionalDate,
  period_label: optionalText,
  grade: optionalText,
  description: optionalText,
  logo: optionalUrl,
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type EducationInput = z.infer<typeof educationSchema>;

export const certificationSchema = z.object({
  title: requiredText("Title", 160),
  issuer: optionalText,
  issue_date: optionalDate,
  expiry_date: optionalDate,
  credential_id: optionalText,
  credential_url: optionalUrl,
  certificate_image: optionalUrl,
  description: optionalText,
  skills: textList,
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type CertificationInput = z.infer<typeof certificationSchema>;

// -----------------------------------------------------------------------------
// Skills, milestones, career map
// -----------------------------------------------------------------------------
export const skillSchema = z.object({
  name: requiredText("Name", 80),
  category: z.enum(SKILL_CATEGORIES),
  proficiency: z
    .union([z.coerce.number().int().min(1).max(5), z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null ? null : v))
    .optional(),
  years: z
    .union([z.coerce.number().min(0).max(50), z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null ? null : v))
    .optional(),
  icon: optionalText,
  color: optionalText,
  description: optionalText,
  technology_id: z
    .union([uuid, z.literal(""), z.null()])
    .transform((v) => (v === "" ? null : v))
    .optional(),
  display_order: displayOrder,
  is_featured: boolFromForm,
  is_visible: boolFromForm,
});
export type SkillInput = z.infer<typeof skillSchema>;

export const skillMilestoneSchema = z.object({
  period_label: requiredText("Period", 40),
  title: requiredText("Title", 120),
  description: optionalText,
  start_year: z
    .union([z.coerce.number().int().min(1990).max(2100), z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null ? null : v))
    .optional(),
  end_year: z
    .union([z.coerce.number().int().min(1990).max(2100), z.literal(""), z.null()])
    .transform((v) => (v === "" || v === null ? null : v))
    .optional(),
  technologies: textList,
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type SkillMilestoneInput = z.infer<typeof skillMilestoneSchema>;

export const careerMapStepSchema = z.object({
  label: requiredText("Label", 60),
  description: optionalText,
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type CareerMapStepInput = z.infer<typeof careerMapStepSchema>;

// -----------------------------------------------------------------------------
// Services, stats, now page
// -----------------------------------------------------------------------------
export const serviceSchema = z.object({
  title: requiredText("Title", 120),
  slug,
  description: optionalText,
  icon: optionalText,
  featured: boolFromForm,
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type ServiceInput = z.infer<typeof serviceSchema>;

export const statSchema = z.object({
  label: requiredText("Label", 60),
  value: requiredText("Value", 20),
  auto_source: z
    .enum(["manual", "projects_count", "technologies_count", "industries_count"])
    .default("manual"),
  description: optionalText,
  display_order: displayOrder,
  is_visible: boolFromForm,
});
export type StatInput = z.infer<typeof statSchema>;

export const nowPageSchema = z.object({
  currently_building: optionalText,
  currently_learning: optionalText,
  current_focus: optionalText,
  open_to: optionalText,
  latest_project_id: z
    .union([uuid, z.literal(""), z.null()])
    .transform((v) => (v === "" ? null : v))
    .optional(),
  is_visible: boolFromForm,
});
export type NowPageInput = z.infer<typeof nowPageSchema>;

// -----------------------------------------------------------------------------
// Contact
// -----------------------------------------------------------------------------
export const PROJECT_TYPES = [
  "Web application",
  "Mobile application",
  "Admin / CRM / HRMS",
  "API / integration",
  "Fintech product",
  "Healthcare product",
  "E-commerce / marketplace",
  "Website",
  "Deployment / infrastructure",
  "Something else",
] as const;

export const BUDGETS = [
  "Not sure yet",
  "Under ₹50k",
  "₹50k – ₹2L",
  "₹2L – ₹5L",
  "₹5L+",
  "Full-time role",
] as const;

export const contactSchema = z.object({
  name: requiredText("Name", 120),
  email: z.string().trim().pipe(z.email("Enter a valid email")),
  phone: optionalText,
  company: optionalText,
  project_type: optionalText,
  budget: optionalText,
  timeline: optionalText,
  message: z
    .string()
    .trim()
    .min(20, "Tell me a little more (at least 20 characters)")
    .max(4000, "Message is too long"),
  // anti-spam
  website: z.string().max(0, "Spam detected").optional().or(z.literal("")),
  started_at: z.coerce.number().optional(),
});
export type ContactInput = z.infer<typeof contactSchema>;

export const contactUpdateSchema = z.object({
  status: z.enum(["new", "read", "replied", "in_discussion", "converted", "closed", "spam"]),
  priority: z.enum(["low", "normal", "high"]),
  notes: optionalText,
});
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;

// -----------------------------------------------------------------------------
// Auth
// -----------------------------------------------------------------------------
export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email("Enter a valid email")),
  password: z.string().min(1, "Password is required"),
});
export type LoginInput = z.infer<typeof loginSchema>;

// -----------------------------------------------------------------------------
// Media
// -----------------------------------------------------------------------------
export const mediaUpdateSchema = z.object({
  alt_text: optionalText,
  folder: z.enum(["profile", "projects", "certificates", "logos", "resume", "og", "general"]),
});
