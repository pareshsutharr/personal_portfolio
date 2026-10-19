import type { Database } from "./database";

export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T];

export type Profile = Tables<"profiles">;
export type SiteSettings = Tables<"site_settings">;
export type SeoSettings = Tables<"seo_settings">;
export type SocialLink = Tables<"social_links">;
export type Industry = Tables<"industries">;
export type Technology = Tables<"technologies">;
export type Project = Tables<"projects">;
export type ProjectTechnology = Tables<"project_technologies">;
export type ProjectFeature = Tables<"project_features">;
export type ProjectImage = Tables<"project_images">;
export type Experience = Tables<"experiences">;
export type Education = Tables<"education">;
export type Certification = Tables<"certifications">;
export type Skill = Tables<"skills">;
export type SkillMilestone = Tables<"skill_milestones">;
export type CareerMapStep = Tables<"career_map_steps">;
export type Service = Tables<"services">;
export type Stat = Tables<"stats">;
export type NowPage = Tables<"now_page">;
export type Media = Tables<"media">;
export type ContactMessage = Tables<"contact_messages">;
export type ClientLogo = Tables<"client_logos">;
export type Video = Tables<"videos">;

export type AvailabilityStatus = Enums<"availability_status">;
export type ProjectStatus = Enums<"project_status">;
export type ProjectVisibility = Enums<"project_visibility">;
export type ConfidentialMode = Enums<"confidential_mode">;
export type ProjectImageType = Enums<"project_image_type">;
export type EmploymentType = Enums<"employment_type">;
export type SkillCategory = Enums<"skill_category">;
export type ContactStatus = Enums<"contact_status">;
export type ContactPriority = Enums<"contact_priority">;

/** Project with its relations, as used by public pages and the admin editor. */
export type ProjectWithRelations = Project & {
  industry: Pick<Industry, "id" | "name" | "slug"> | null;
  client_logo: Pick<ClientLogo, "id" | "name" | "logo_url" | "url"> | null;
  technologies: Technology[];
  features: ProjectFeature[];
  images: ProjectImage[];
  related: Pick<Project, "id" | "title" | "slug" | "category" | "thumbnail" | "cover_image">[];
};

export type SkillWithProjects = Skill & {
  projects: Pick<Project, "id" | "title" | "slug">[];
};

/** Standard result shape for server actions. */
export type ActionResult<T = undefined> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string[]> };

export const AVAILABILITY_LABELS: Record<AvailabilityStatus, string> = {
  available: "Available",
  selected_projects: "Available for selected projects",
  open_to_opportunities: "Open to opportunities",
  not_available: "Not currently available",
};

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: "New",
  read: "Read",
  replied: "Replied",
  in_discussion: "In discussion",
  converted: "Converted",
  closed: "Closed",
  spam: "Spam",
};

export const SKILL_CATEGORY_LABELS: Record<SkillCategory, string> = {
  frontend: "Frontend",
  backend: "Backend",
  mobile: "Mobile",
  database: "Database",
  devops: "DevOps",
  cloud: "Cloud",
  fintech: "Fintech",
  healthcare: "Healthcare",
  seo: "SEO",
  design: "Design",
  tools: "Tools",
  services: "Services",
};

export const EMPLOYMENT_TYPE_LABELS: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  internship: "Internship",
  contract: "Contract",
  freelance: "Freelance",
};

export const PROJECT_IMAGE_TYPE_LABELS: Record<ProjectImageType, string> = {
  hero: "Hero",
  screenshot: "Screenshot",
  dashboard: "Dashboard",
  mobile: "Mobile",
  architecture: "Architecture",
  gallery: "Gallery",
};
