-- =============================================================================
-- Storage: one public bucket for all portfolio media.
--   media/profile/*       portrait, hero, about photos
--   media/projects/*      covers, thumbnails, screenshots
--   media/certificates/*  certificate images
--   media/logos/*         company / institution logos
--   media/resume/*        PDF resume
--   media/og/*            social share images
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media',
  'media',
  true,
  10485760, -- 10 MB
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- Anyone can read objects in the public bucket.
create policy "media_public_read" on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'media');

-- Admins get insert + select + update + delete (upsert requires all three writes).
create policy "media_admin_insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());

create policy "media_admin_update" on storage.objects
  for update to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

create policy "media_admin_delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());
