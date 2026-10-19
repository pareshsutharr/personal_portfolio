import type {
  ClientLogo,
  ConfidentialMode,
  Industry,
  Project,
  ProjectFeature,
  ProjectImage,
  ProjectStatus,
  ProjectVisibility,
  Technology,
} from "@/types";

/** Form state: strings everywhere, parsed by `projectSchema` on submit. */
export type ProjectFormValues = {
  title: string;
  slug: string;
  short_description: string;
  full_description: string;
  category: string;
  industry_id: string;
  client_logo_id: string;
  client: string;
  company: string;
  role: string;
  project_type: string;
  platforms: string[];
  start_date: string;
  end_date: string;
  year_label: string;
  status: ProjectStatus;
  visibility: ProjectVisibility;
  featured: boolean;
  confidential: boolean;
  confidential_mode: ConfidentialMode;
  live_url: string;
  github_url: string;
  app_store_url: string;
  play_store_url: string;
  cover_image: string;
  thumbnail: string;
  cover_alt: string;
  cover_frame: string;
  overview: string;
  problem: string;
  objective: string;
  /** One responsibility per line. */
  responsibilities: string;
  architecture: string;
  challenge: string;
  solution: string;
  outcome: string;
  impact: string;
  results: string;
  meta_title: string;
  meta_description: string;
  og_image: string;
  canonical_url: string;
  display_order: number;
  technology_ids: string[];
  related_project_ids: string[];
};

export type EditorProject = Project & {
  technology_ids: string[];
  related_project_ids: string[];
  features: ProjectFeature[];
  images: ProjectImage[];
};

export type RelatedOption = Pick<Project, "id" | "title" | "slug" | "status" | "category">;

export type ProjectEditorProps = {
  project: EditorProject | null;
  technologies: Technology[];
  industries: Pick<Industry, "id" | "name">[];
  clients: Pick<ClientLogo, "id" | "name">[];
  otherProjects: RelatedOption[];
  /** Public origin used for URL previews, e.g. https://pareshsuthar.dev */
  siteUrl: string;
};

export type EditorTab =
  "basics" | "case-study" | "technologies" | "features" | "images" | "links" | "seo" | "related";

/** Which tab owns each field, so validation errors can focus the right tab. */
export const FIELD_TAB: Partial<Record<keyof ProjectFormValues, EditorTab>> = {
  title: "basics",
  slug: "basics",
  short_description: "basics",
  full_description: "basics",
  category: "basics",
  client: "basics",
  company: "basics",
  role: "basics",
  project_type: "basics",
  platforms: "basics",
  start_date: "basics",
  end_date: "basics",
  year_label: "basics",
  overview: "case-study",
  problem: "case-study",
  objective: "case-study",
  responsibilities: "case-study",
  architecture: "case-study",
  challenge: "case-study",
  solution: "case-study",
  outcome: "case-study",
  impact: "case-study",
  results: "case-study",
  technology_ids: "technologies",
  cover_image: "images",
  thumbnail: "images",
  cover_alt: "images",
  cover_frame: "images",
  live_url: "links",
  github_url: "links",
  app_store_url: "links",
  play_store_url: "links",
  meta_title: "seo",
  meta_description: "seo",
  og_image: "seo",
  canonical_url: "seo",
  related_project_ids: "related",
};

export const CATEGORY_SUGGESTIONS = [
  "Fintech / Wealth Management",
  "HRMS / Enterprise",
  "CRM / Enterprise",
  "Healthcare",
  "E-commerce / Food",
  "Travel",
  "Rental / Marketplace",
  "Manufacturing / Corporate",
  "Enterprise Integration",
  "IPO / Fintech",
];

export const PLATFORM_OPTIONS = ["Web", "iOS", "Android", "Mobile", "Desktop", "API"];

export const STATUS_OPTIONS: { value: ProjectStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
  { value: "archived", label: "Archived" },
];

export const VISIBILITY_OPTIONS: { value: ProjectVisibility; label: string; hint: string }[] = [
  { value: "public", label: "Public", hint: "Listed on /projects and in search." },
  { value: "unlisted", label: "Unlisted", hint: "Reachable by URL, not listed." },
  { value: "private", label: "Private", hint: "Admin only." },
];

export const CONFIDENTIAL_MODE_OPTIONS: { value: ConfidentialMode; label: string; hint: string }[] =
  [
    { value: "summary", label: "Summary", hint: "Title, category, summary and stack only." },
    {
      value: "full",
      label: "Full",
      hint: "Everything shown; client replaced by “Confidential client”.",
    },
    { value: "hidden", label: "Hidden", hint: "Never shown publicly." },
  ];

const str = (v: string | null | undefined) => v ?? "";

export function toFormValues(project: EditorProject | null): ProjectFormValues {
  if (!project) {
    return {
      title: "",
      slug: "",
      short_description: "",
      full_description: "",
      category: "",
      industry_id: "",
      client_logo_id: "",
      client: "",
      company: "",
      role: "",
      project_type: "",
      platforms: [],
      start_date: "",
      end_date: "",
      year_label: "",
      status: "draft",
      visibility: "public",
      featured: false,
      confidential: false,
      confidential_mode: "summary",
      live_url: "",
      github_url: "",
      app_store_url: "",
      play_store_url: "",
      cover_image: "",
      thumbnail: "",
      cover_alt: "",
      cover_frame: "laptop",
      overview: "",
      problem: "",
      objective: "",
      responsibilities: "",
      architecture: "",
      challenge: "",
      solution: "",
      outcome: "",
      impact: "",
      results: "",
      meta_title: "",
      meta_description: "",
      og_image: "",
      canonical_url: "",
      display_order: 0,
      technology_ids: [],
      related_project_ids: [],
    };
  }
  return {
    title: project.title,
    slug: project.slug,
    short_description: str(project.short_description),
    full_description: str(project.full_description),
    category: str(project.category),
    industry_id: str(project.industry_id),
    client_logo_id: str(project.client_logo_id),
    client: str(project.client),
    company: str(project.company),
    role: str(project.role),
    project_type: str(project.project_type),
    platforms: project.platforms ?? [],
    start_date: str(project.start_date),
    end_date: str(project.end_date),
    year_label: str(project.year_label),
    status: project.status,
    visibility: project.visibility,
    featured: project.featured,
    confidential: project.confidential,
    confidential_mode: project.confidential_mode,
    live_url: str(project.live_url),
    github_url: str(project.github_url),
    app_store_url: str(project.app_store_url),
    play_store_url: str(project.play_store_url),
    cover_image: str(project.cover_image),
    thumbnail: str(project.thumbnail),
    cover_alt: str(project.cover_alt),
    cover_frame: project.cover_frame || "laptop",
    overview: str(project.overview),
    problem: str(project.problem),
    objective: str(project.objective),
    responsibilities: (project.responsibilities ?? []).join("\n"),
    architecture: str(project.architecture),
    challenge: str(project.challenge),
    solution: str(project.solution),
    outcome: str(project.outcome),
    impact: str(project.impact),
    results: str(project.results),
    meta_title: str(project.meta_title),
    meta_description: str(project.meta_description),
    og_image: str(project.og_image),
    canonical_url: str(project.canonical_url),
    display_order: project.display_order ?? 0,
    technology_ids: project.technology_ids,
    related_project_ids: project.related_project_ids,
  };
}
