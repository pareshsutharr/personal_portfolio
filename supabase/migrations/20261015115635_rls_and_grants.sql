-- =============================================================================
-- Grants + Row Level Security
--
-- Grants decide whether a role can reach a table through the Data API at all.
-- RLS decides which rows that role can see. Both are explicit here because
-- new Supabase projects no longer expose tables automatically.
-- =============================================================================

-- Schema usage
grant usage on schema public to anon, authenticated, service_role;

-- Public-content tables: anon/authenticated read; writes gated by RLS (admin).
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'site_settings', 'seo_settings', 'social_links', 'industries',
    'technologies', 'projects', 'project_technologies', 'project_features',
    'project_images', 'related_projects', 'experiences', 'education',
    'certifications', 'skills', 'skill_milestones', 'career_map_steps',
    'services', 'stats', 'now_page', 'media'
  ]
  loop
    execute format('grant select on public.%I to anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Contact messages: inserted server-side with the secret key; admins manage.
grant select, update, delete on public.contact_messages to authenticated;
grant all on public.contact_messages to service_role;
alter table public.contact_messages enable row level security;

grant execute on function public.is_admin() to anon, authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Admin write policies (one per table)
-- -----------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'site_settings', 'seo_settings', 'social_links', 'industries',
    'technologies', 'projects', 'project_technologies', 'project_features',
    'project_images', 'related_projects', 'experiences', 'education',
    'certifications', 'skills', 'skill_milestones', 'career_map_steps',
    'services', 'stats', 'now_page', 'media', 'contact_messages'
  ]
  loop
    execute format(
      'create policy %I on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_all', t
    );
  end loop;
end $$;

-- -----------------------------------------------------------------------------
-- Public read policies
-- -----------------------------------------------------------------------------
create policy profiles_public_read on public.profiles
  for select to anon, authenticated using (true);

create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);

create policy seo_settings_public_read on public.seo_settings
  for select to anon, authenticated using (true);

create policy social_links_public_read on public.social_links
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy industries_public_read on public.industries
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy technologies_public_read on public.technologies
  for select to anon, authenticated using (true);

-- Projects: published + not private + not soft-deleted. Unlisted rows are
-- readable (direct link) but excluded from listings in application code.
create policy projects_public_read on public.projects
  for select to anon, authenticated using (
    public.is_admin()
    or (status = 'published' and visibility <> 'private' and deleted_at is null)
  );

create policy project_technologies_public_read on public.project_technologies
  for select to anon, authenticated using (
    public.is_admin() or exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.status = 'published' and p.visibility <> 'private' and p.deleted_at is null
    )
  );

create policy project_features_public_read on public.project_features
  for select to anon, authenticated using (
    public.is_admin() or exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.status = 'published' and p.visibility <> 'private' and p.deleted_at is null
    )
  );

create policy project_images_public_read on public.project_images
  for select to anon, authenticated using (
    public.is_admin() or exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.status = 'published' and p.visibility <> 'private' and p.deleted_at is null
    )
  );

create policy related_projects_public_read on public.related_projects
  for select to anon, authenticated using (true);

create policy experiences_public_read on public.experiences
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy education_public_read on public.education
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy certifications_public_read on public.certifications
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy skills_public_read on public.skills
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy skill_milestones_public_read on public.skill_milestones
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy career_map_steps_public_read on public.career_map_steps
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy services_public_read on public.services
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy stats_public_read on public.stats
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy now_page_public_read on public.now_page
  for select to anon, authenticated using (is_visible or public.is_admin());

create policy media_public_read on public.media
  for select to anon, authenticated using (true);

-- contact_messages: no public read policy; the admin policy above covers it.
