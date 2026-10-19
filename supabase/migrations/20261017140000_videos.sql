-- Marketing / brand videos produced at a company; shown on the experience page.
create table public.videos (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  video_url text not null,
  thumbnail_url text,
  company text,
  experience_id uuid references public.experiences (id) on delete set null,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index videos_order_idx on public.videos (display_order);
create index videos_experience_idx on public.videos (experience_id);
create trigger videos_updated_at before update on public.videos
  for each row execute function public.set_updated_at();

grant select on public.videos to anon;
grant select, insert, update, delete on public.videos to authenticated;
grant all on public.videos to service_role;
alter table public.videos enable row level security;

create policy videos_public_read on public.videos
  for select to anon, authenticated using (is_visible or public.is_admin());
create policy videos_admin_insert on public.videos
  for insert to authenticated with check (public.is_admin());
create policy videos_admin_update on public.videos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy videos_admin_delete on public.videos
  for delete to authenticated using (public.is_admin());
