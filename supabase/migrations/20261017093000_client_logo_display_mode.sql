-- Per-client choice of what the marquee shows: the logo, the name, or auto (logo when present).
alter table public.client_logos
  add column display_mode text not null default 'auto'
  check (display_mode in ('auto', 'logo', 'name'));
