-- New projects default to the laptop frame; raw screenshots look right without extra work.
alter table public.projects alter column cover_frame set default 'laptop';
