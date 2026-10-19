-- First-party, cookie-free page views. Written only by the server (service role)
-- and read only in the admin. No personal data: `visitor` is a daily keyed hash
-- of IP + user agent that cannot be reversed or linked across days.
create table public.page_views (
  id bigint generated always as identity primary key,
  ts timestamptz not null default now(),
  day date not null,
  path text not null,
  referrer_host text,
  source text not null default 'direct',
  medium text not null default 'none',
  campaign text,
  country text,
  device text,
  visitor text not null
);
create index page_views_day_idx on public.page_views (day desc);
create index page_views_day_path_idx on public.page_views (day, path);
create index page_views_day_source_idx on public.page_views (day, source);
alter table public.page_views enable row level security;
-- No policies on purpose: anon and authenticated roles can neither read nor write.
