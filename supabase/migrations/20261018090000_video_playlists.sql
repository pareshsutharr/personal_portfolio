-- Group videos into playlists (e.g. a YouTube series). Free-text name + optional link.
alter table public.videos
  add column playlist text,
  add column playlist_url text,
  add column duration text,
  add column published_at date;
create index videos_playlist_idx on public.videos (playlist);
