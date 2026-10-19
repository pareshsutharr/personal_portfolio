-- =============================================================================
-- Portfolio CMS schema
-- Paresh Suthar — personal portfolio + admin CMS
-- =============================================================================

create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.availability_status as enum (
  'available',
  'selected_projects',
  'open_to_opportunities',
  'not_available'
);

create type public.project_status as enum ('draft', 'published', 'archived');
create type public.project_visibility as enum ('public', 'private', 'unlisted');
create type public.confidential_mode as enum ('hidden', 'summary', 'full');
create type public.project_image_type as enum (
  'hero', 'screenshot', 'dashboard', 'mobile', 'architecture', 'gallery'
);
create type public.employment_type as enum (
  'full_time', 'part_time', 'internship', 'contract', 'freelance'
);
create type public.skill_category as enum (
  'frontend', 'backend', 'mobile', 'database', 'devops', 'cloud',
  'fintech', 'healthcare', 'seo', 'design', 'tools', 'services'
);
create type public.contact_status as enum (
  'new', 'read', 'replied', 'in_discussion', 'converted', 'closed', 'spam'
);
create type public.contact_priority as enum ('low', 'normal', 'high');

-- -----------------------------------------------------------------------------
-- Helpers
-- -----------------------------------------------------------------------------

-- Admin check based on app_metadata (set server-side; never user-editable).
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin',
    false
  );
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- Profile (singleton)
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  professional_title text not null,
  short_bio text,
  long_bio text,
  personal_intro text,
  philosophy text,
  career_summary text,
  current_focus text,
  what_i_build text,
  looking_for text,
  location text,
  email text,
  phone text,
  profile_photo text,
  hero_photo text,
  about_photo text,
  resume_url text,
  availability_status public.availability_status not null default 'selected_projects',
  availability_text text,
  years_experience text,
  hero_kicker text,
  hero_line_1 text,
  hero_line_2 text,
  hero_tagline text,
  hero_keywords text[] not null default '{}',
  cta_primary_text text,
  cta_secondary_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Site settings + SEO (singletons)
-- -----------------------------------------------------------------------------
create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  site_name text not null default 'Paresh Suthar',
  logo_url text,
  favicon_url text,
  contact_email text,
  contact_phone text,
  location text,
  footer_tagline text,
  copyright_text text,
  cta_heading text,
  cta_subheading text,
  cta_button_text text,
  ga_measurement_id text,
  vercel_analytics_enabled boolean not null default false,
  notification_email text,
  show_now_page boolean not null default true,
  theme_accent text not null default 'ember',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

create table public.seo_settings (
  id uuid primary key default gen_random_uuid(),
  site_title text not null default 'Paresh Suthar — Full Stack Software Engineer',
  title_template text not null default '%s — Paresh Suthar',
  meta_description text,
  keywords text[] not null default '{}',
  og_title text,
  og_description text,
  og_image text,
  twitter_image text,
  twitter_handle text,
  favicon text,
  google_verification text,
  canonical_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger seo_settings_updated_at before update on public.seo_settings
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Social links
-- -----------------------------------------------------------------------------
create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  username text,
  url text not null,
  icon text,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index social_links_order_idx on public.social_links (display_order);
create trigger social_links_updated_at before update on public.social_links
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Industries
-- -----------------------------------------------------------------------------
create table public.industries (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  icon text,
  project_count int,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index industries_order_idx on public.industries (display_order);
create trigger industries_updated_at before update on public.industries
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Technologies
-- -----------------------------------------------------------------------------
create table public.technologies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  category public.skill_category not null default 'tools',
  color text,
  description text,
  created_at timestamptz not null default now()
);
create index technologies_category_idx on public.technologies (category);

-- -----------------------------------------------------------------------------
-- Projects
-- -----------------------------------------------------------------------------
create table public.projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  short_description text,
  full_description text,
  category text,
  industry_id uuid references public.industries (id) on delete set null,
  client text,
  company text,
  role text,
  project_type text,
  platforms text[] not null default '{}',
  start_date date,
  end_date date,
  year_label text,
  status public.project_status not null default 'draft',
  visibility public.project_visibility not null default 'public',
  featured boolean not null default false,
  confidential boolean not null default false,
  confidential_mode public.confidential_mode not null default 'summary',
  live_url text,
  github_url text,
  app_store_url text,
  play_store_url text,
  cover_image text,
  thumbnail text,
  cover_alt text,
  -- case study
  overview text,
  problem text,
  objective text,
  responsibilities text[] not null default '{}',
  architecture text,
  challenge text,
  solution text,
  outcome text,
  impact text,
  results text,
  -- seo
  meta_title text,
  meta_description text,
  og_image text,
  canonical_url text,
  display_order int not null default 0,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index projects_status_idx on public.projects (status, visibility, featured);
create index projects_order_idx on public.projects (display_order);
create index projects_industry_idx on public.projects (industry_id);
create trigger projects_updated_at before update on public.projects
  for each row execute function public.set_updated_at();

create table public.project_technologies (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  technology_id uuid not null references public.technologies (id) on delete cascade,
  unique (project_id, technology_id)
);
create index project_technologies_project_idx on public.project_technologies (project_id);
create index project_technologies_tech_idx on public.project_technologies (technology_id);

create table public.project_features (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  title text not null,
  description text,
  icon text,
  display_order int not null default 0
);
create index project_features_project_idx on public.project_features (project_id, display_order);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  image_url text not null,
  alt_text text,
  caption text,
  type public.project_image_type not null default 'screenshot',
  display_order int not null default 0,
  created_at timestamptz not null default now()
);
create index project_images_project_idx on public.project_images (project_id, display_order);

create table public.related_projects (
  project_id uuid not null references public.projects (id) on delete cascade,
  related_project_id uuid not null references public.projects (id) on delete cascade,
  primary key (project_id, related_project_id),
  check (project_id <> related_project_id)
);

-- -----------------------------------------------------------------------------
-- Experience
-- -----------------------------------------------------------------------------
create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  position text not null,
  employment_type public.employment_type not null default 'full_time',
  location text,
  start_date date,
  end_date date,
  period_label text,
  is_current boolean not null default false,
  description text,
  responsibilities text[] not null default '{}',
  technologies text[] not null default '{}',
  achievements text[] not null default '{}',
  company_url text,
  logo text,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index experiences_order_idx on public.experiences (display_order);
create trigger experiences_updated_at before update on public.experiences
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Education
-- -----------------------------------------------------------------------------
create table public.education (
  id uuid primary key default gen_random_uuid(),
  institution text not null,
  degree text not null,
  field text,
  start_date date,
  end_date date,
  period_label text,
  grade text,
  description text,
  logo text,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger education_updated_at before update on public.education
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Certifications
-- -----------------------------------------------------------------------------
create table public.certifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  issuer text,
  issue_date date,
  expiry_date date,
  credential_id text,
  credential_url text,
  certificate_image text,
  description text,
  skills text[] not null default '{}',
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index certifications_order_idx on public.certifications (display_order);
create trigger certifications_updated_at before update on public.certifications
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Skills
-- -----------------------------------------------------------------------------
create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category public.skill_category not null default 'tools',
  proficiency int check (proficiency between 1 and 5),
  years numeric(4,1),
  icon text,
  color text,
  description text,
  technology_id uuid references public.technologies (id) on delete set null,
  display_order int not null default 0,
  is_featured boolean not null default false,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index skills_category_idx on public.skills (category, display_order);
create trigger skills_updated_at before update on public.skills
  for each row execute function public.set_updated_at();

-- Skill timeline (technology journey)
create table public.skill_milestones (
  id uuid primary key default gen_random_uuid(),
  period_label text not null,
  title text not null,
  description text,
  start_year int,
  end_year int,
  technologies text[] not null default '{}',
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger skill_milestones_updated_at before update on public.skill_milestones
  for each row execute function public.set_updated_at();

-- Career map (LEARNING → ... → SOFTWARE ENGINEER)
create table public.career_map_steps (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  description text,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- Services
-- -----------------------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  icon text,
  featured boolean not null default false,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger services_updated_at before update on public.services
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Stats (editable personal statistics)
-- -----------------------------------------------------------------------------
create table public.stats (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  -- 'manual' uses value as-is; others are computed live from the CMS.
  auto_source text not null default 'manual'
    check (auto_source in ('manual', 'projects_count', 'technologies_count', 'industries_count')),
  description text,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger stats_updated_at before update on public.stats
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Now page (singleton)
-- -----------------------------------------------------------------------------
create table public.now_page (
  id uuid primary key default gen_random_uuid(),
  currently_building text,
  currently_learning text,
  current_focus text,
  open_to text,
  latest_project_id uuid references public.projects (id) on delete set null,
  is_visible boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger now_page_updated_at before update on public.now_page
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Media library
-- -----------------------------------------------------------------------------
create table public.media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null unique,
  url text not null,
  filename text not null,
  mime_type text,
  size_bytes bigint,
  width int,
  height int,
  alt_text text,
  folder text not null default 'general',
  created_at timestamptz not null default now()
);
create index media_folder_idx on public.media (folder, created_at desc);

-- -----------------------------------------------------------------------------
-- Contact messages
-- -----------------------------------------------------------------------------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  company text,
  subject text,
  message text not null,
  project_type text,
  budget text,
  timeline text,
  source text,
  ip_hash text,
  status public.contact_status not null default 'new',
  priority public.contact_priority not null default 'normal',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index contact_messages_status_idx on public.contact_messages (status, created_at desc);
create index contact_messages_ip_idx on public.contact_messages (ip_hash, created_at desc);
create trigger contact_messages_updated_at before update on public.contact_messages
  for each row execute function public.set_updated_at();
