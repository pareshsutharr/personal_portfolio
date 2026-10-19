-- Client / company logos shown in the hero marquee.
create table public.client_logos (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  url text,
  display_order int not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index client_logos_order_idx on public.client_logos (display_order);
create trigger client_logos_updated_at before update on public.client_logos
  for each row execute function public.set_updated_at();

grant select on public.client_logos to anon;
grant select, insert, update, delete on public.client_logos to authenticated;
grant all on public.client_logos to service_role;
alter table public.client_logos enable row level security;

create policy client_logos_public_read on public.client_logos
  for select to anon, authenticated using (is_visible or public.is_admin());
create policy client_logos_admin_insert on public.client_logos
  for insert to authenticated with check (public.is_admin());
create policy client_logos_admin_update on public.client_logos
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy client_logos_admin_delete on public.client_logos
  for delete to authenticated using (public.is_admin());

-- Seed with the companies/products already in the portfolio (names only; upload logos from admin).
insert into public.client_logos (name, display_order) values
  ('Growth Avenues', 1), ('JBV Share Broker & Fintech', 2), ('BEIPOREADY', 3), ('JustRentIt', 4),
  ('GumiGumi Travel', 5), ('Bhavvya EcoPack', 6), ('Biryani Bazar', 7), ('Maeve', 8);
