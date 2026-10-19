-- =============================================================================
-- Advisor fixes
--   * pin function search_path
--   * split admin "for all" policies so SELECT has a single permissive policy
--   * index remaining foreign keys
-- =============================================================================

alter function public.is_admin() set search_path = '';
alter function public.set_updated_at() set search_path = '';

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
    execute format('drop policy if exists %I on public.%I', t || '_admin_all', t);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (public.is_admin())',
      t || '_admin_insert', t);
    execute format(
      'create policy %I on public.%I for update to authenticated using (public.is_admin()) with check (public.is_admin())',
      t || '_admin_update', t);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (public.is_admin())',
      t || '_admin_delete', t);
  end loop;
end $$;

-- contact_messages has no public read policy, so admins need an explicit one.
create policy contact_messages_admin_select on public.contact_messages
  for select to authenticated using (public.is_admin());

create index if not exists now_page_latest_project_idx on public.now_page (latest_project_id);
create index if not exists related_projects_related_idx on public.related_projects (related_project_id);
create index if not exists skills_technology_idx on public.skills (technology_id);
