-- English subtitles per YouTube video, shared by everyone, so each video is
-- fetched once. cues is null when the video has no English captions.
-- Written by the captions route as the signed-in user: rows can be added but
-- never changed, so a cached transcript can't be overwritten.
create table public.video_captions (
  video_id text primary key check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  cues jsonb,
  source text not null check (source in ('youtube', 'supadata')),
  fetched_at timestamptz not null default now()
);

alter table public.video_captions enable row level security;

create policy "read captions" on public.video_captions
  for select to authenticated using (true);

create policy "add captions" on public.video_captions
  for insert to authenticated with check (true);
