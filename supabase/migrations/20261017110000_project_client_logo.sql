-- Link a project to the client/company it was built for (logo shown in the case study header).
alter table public.projects
  add column client_logo_id uuid references public.client_logos (id) on delete set null;
create index projects_client_logo_idx on public.projects (client_logo_id);
