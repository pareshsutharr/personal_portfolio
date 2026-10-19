-- How the cover image is presented: raw, or wrapped in a browser / laptop / phone frame.
alter table public.projects
  add column cover_frame text not null default 'none'
  check (cover_frame in ('none', 'browser', 'laptop', 'phone'));
