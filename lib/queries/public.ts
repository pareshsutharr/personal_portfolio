import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import type {
  CareerMapStep,
  Certification,
  ClientLogo,
  Education,
  Experience,
  Industry,
  Media,
  NowPage,
  Profile,
  Project,
  ProjectWithRelations,
  SeoSettings,
  Service,
  SiteSettings,
  Skill,
  SkillMilestone,
  SkillWithProjects,
  SocialLink,
  Stat,
  Technology,
  Video,
} from "@/types";

/**
 * Public read layer. Every function uses the anonymous client, so RLS limits
 * results to published / visible rows. Wrapped in React `cache` for per-request
 * de-duplication (layout + page can both ask for the profile).
 */

const PROJECT_LISTABLE = { status: "published" as const, visibility: "public" as const };

export const getProfile = cache(async (): Promise<Profile | null> => {
  const supabase = createPublicClient();
  const { data } = await supabase.from("profiles").select("*").limit(1).maybeSingle();
  return data;
});

export const getSiteSettings = cache(async (): Promise<SiteSettings | null> => {
  const supabase = createPublicClient();
  const { data } = await supabase.from("site_settings").select("*").limit(1).maybeSingle();
  return data;
});

export const getSeoSettings = cache(async (): Promise<SeoSettings | null> => {
  const supabase = createPublicClient();
  const { data } = await supabase.from("seo_settings").select("*").limit(1).maybeSingle();
  return data;
});

export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("social_links")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");
  return data ?? [];
});

export const getIndustries = cache(async (): Promise<(Industry & { computed_count: number })[]> => {
  const supabase = createPublicClient();
  const [{ data: industries }, { data: projects }] = await Promise.all([
    supabase.from("industries").select("*").eq("is_visible", true).order("display_order"),
    supabase.from("projects").select("industry_id").match(PROJECT_LISTABLE).is("deleted_at", null),
  ]);
  const counts = new Map<string, number>();
  for (const p of projects ?? []) {
    if (p.industry_id) counts.set(p.industry_id, (counts.get(p.industry_id) ?? 0) + 1);
  }
  return (industries ?? []).map((i) => ({
    ...i,
    computed_count: i.project_count ?? counts.get(i.id) ?? 0,
  }));
});

export const getTechnologies = cache(async (): Promise<Technology[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase.from("technologies").select("*").order("name");
  return data ?? [];
});

const projectSelect = `
  *,
  industry:industries ( id, name, slug ),
  client_logo:client_logos ( id, name, logo_url, url ),
  project_technologies ( technology:technologies ( * ) ),
  features:project_features ( * ),
  images:project_images ( * )
`;

type RawProject = Project & {
  industry: { id: string; name: string; slug: string } | null;
  client_logo: ProjectWithRelations["client_logo"];
  project_technologies: { technology: Technology | null }[];
  features: ProjectWithRelations["features"];
  images: ProjectWithRelations["images"];
};

function normalizeProject(
  raw: RawProject,
  related: ProjectWithRelations["related"] = [],
): ProjectWithRelations {
  const { project_technologies, features, images, ...rest } = raw;
  return {
    ...rest,
    technologies: project_technologies
      .map((pt) => pt.technology)
      .filter((t): t is Technology => Boolean(t))
      .sort((a, b) => a.name.localeCompare(b.name)),
    features: [...(features ?? [])].sort((a, b) => a.display_order - b.display_order),
    images: [...(images ?? [])].sort((a, b) => a.display_order - b.display_order),
    related,
  };
}

/** Published + public projects for listings (unlisted excluded). */
export const getProjects = cache(async (): Promise<ProjectWithRelations[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("projects")
    .select(projectSelect)
    .match(PROJECT_LISTABLE)
    .is("deleted_at", null)
    .neq("confidential_mode", "hidden")
    .order("display_order");
  return ((data ?? []) as unknown as RawProject[]).map((p) => normalizeProject(p));
});

export const getFeaturedProjects = cache(async (limit = 6): Promise<ProjectWithRelations[]> => {
  const all = await getProjects();
  const featured = all.filter((p) => p.featured);
  return (featured.length ? featured : all).slice(0, limit);
});

/** Single project by slug (unlisted allowed; private/draft blocked by RLS). */
export const getProjectBySlug = cache(
  async (slug: string): Promise<ProjectWithRelations | null> => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("projects")
      .select(projectSelect)
      .eq("slug", slug)
      .is("deleted_at", null)
      .maybeSingle();
    if (!data) return null;
    const raw = data as unknown as RawProject;
    if (raw.confidential && raw.confidential_mode === "hidden") return null;

    const { data: relatedRows } = await supabase
      .from("related_projects")
      .select(
        "related:projects!related_projects_related_project_id_fkey ( id, title, slug, category, thumbnail, cover_image, status, visibility, deleted_at )",
      )
      .eq("project_id", raw.id);

    let related = (relatedRows ?? [])
      .map((r) => r.related as unknown as (Project & { status: string }) | null)
      .filter(
        (p): p is Project =>
          Boolean(p) && p!.status === "published" && p!.visibility === "public" && !p!.deleted_at,
      )
      .map(({ id, title, slug, category, thumbnail, cover_image }) => ({
        id,
        title,
        slug,
        category,
        thumbnail,
        cover_image,
      }));

    if (related.length === 0) {
      // Fallback: same industry or category, excluding itself.
      const all = await getProjects();
      related = all
        .filter(
          (p) =>
            p.id !== raw.id && (p.industry_id === raw.industry_id || p.category === raw.category),
        )
        .slice(0, 3)
        .map(({ id, title, slug, category, thumbnail, cover_image }) => ({
          id,
          title,
          slug,
          category,
          thumbnail,
          cover_image,
        }));
    }
    return normalizeProject(raw, related);
  },
);

export const getProjectSlugs = cache(async (): Promise<{ slug: string; updated_at: string }[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("projects")
    .select("slug, updated_at")
    .match(PROJECT_LISTABLE)
    .is("deleted_at", null)
    .neq("confidential_mode", "hidden");
  return data ?? [];
});

export const getExperiences = cache(async (): Promise<Experience[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("experiences")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");
  return data ?? [];
});

export const getEducation = cache(async (): Promise<Education[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("education")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");
  return data ?? [];
});

export const getCertifications = cache(async (): Promise<Certification[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("certifications")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");
  return data ?? [];
});

/** Skills with the published projects that use the linked technology. */
export const getSkills = cache(async (): Promise<SkillWithProjects[]> => {
  const supabase = createPublicClient();
  const [{ data: skills }, { data: links }] = await Promise.all([
    supabase.from("skills").select("*").eq("is_visible", true).order("display_order"),
    supabase
      .from("project_technologies")
      .select(
        "technology_id, project:projects ( id, title, slug, status, visibility, deleted_at )",
      ),
  ]);
  const byTech = new Map<string, { id: string; title: string; slug: string }[]>();
  for (const l of links ?? []) {
    const p = l.project as unknown as (Project & { deleted_at: string | null }) | null;
    if (!p || p.status !== "published" || p.visibility !== "public" || p.deleted_at) continue;
    const arr = byTech.get(l.technology_id) ?? [];
    arr.push({ id: p.id, title: p.title, slug: p.slug });
    byTech.set(l.technology_id, arr);
  }
  return ((skills ?? []) as Skill[]).map((s) => ({
    ...s,
    projects: s.technology_id ? (byTech.get(s.technology_id) ?? []) : [],
  }));
});

export const getSkillMilestones = cache(async (): Promise<SkillMilestone[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("skill_milestones")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");
  return data ?? [];
});

export const getCareerMap = cache(async (): Promise<CareerMapStep[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("career_map_steps")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");
  return data ?? [];
});

export const getServices = cache(async (): Promise<Service[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("services")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");
  return data ?? [];
});

/** Stats with auto-computed values resolved. */
export const getStats = cache(async (): Promise<(Stat & { resolved_value: string })[]> => {
  const supabase = createPublicClient();
  const { data: stats } = await supabase
    .from("stats")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");
  if (!stats?.length) return [];

  const needs = new Set(stats.map((s) => s.auto_source));
  const [projects, technologies, industries] = await Promise.all([
    needs.has("projects_count")
      ? supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .match(PROJECT_LISTABLE)
          .is("deleted_at", null)
      : null,
    needs.has("technologies_count")
      ? supabase.from("technologies").select("id", { count: "exact", head: true })
      : null,
    needs.has("industries_count")
      ? supabase
          .from("industries")
          .select("id", { count: "exact", head: true })
          .eq("is_visible", true)
      : null,
  ]);

  return stats.map((s) => {
    let resolved = s.value;
    if (s.auto_source === "projects_count") resolved = String(projects?.count ?? 0);
    if (s.auto_source === "technologies_count") resolved = String(technologies?.count ?? 0);
    if (s.auto_source === "industries_count") resolved = String(industries?.count ?? 0);
    return { ...s, resolved_value: resolved };
  });
});

export const getNowPage = cache(
  async (): Promise<
    (NowPage & { latest_project: Pick<Project, "title" | "slug"> | null }) | null
  > => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("now_page")
      .select("*, latest_project:projects ( title, slug )")
      .eq("is_visible", true)
      .limit(1)
      .maybeSingle();
    return (
      (data as unknown as
        (NowPage & { latest_project: Pick<Project, "title" | "slug"> | null }) | null) ?? null
    );
  },
);

export const getClientLogos = cache(async (): Promise<ClientLogo[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("client_logos")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");
  return data ?? [];
});

/** Photos from one media-library folder (e.g. "travel"), newest first. */
export const getMediaFolder = cache(async (folder: string, limit = 12): Promise<Media[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("media")
    .select("*")
    .eq("folder", folder)
    .like("mime_type", "image/%")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
});

export const getVideos = cache(async (): Promise<Video[]> => {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .eq("is_visible", true)
    .order("display_order");
  return data ?? [];
});

/** Everything the public shell (nav/footer/metadata) needs in one call. */
export const getSiteShell = cache(async () => {
  const [profile, settings, seo, socialLinks] = await Promise.all([
    getProfile(),
    getSiteSettings(),
    getSeoSettings(),
    getSocialLinks(),
  ]);
  return { profile, settings, seo, socialLinks };
});
