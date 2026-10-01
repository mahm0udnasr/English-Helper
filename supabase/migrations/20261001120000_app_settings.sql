-- Settings the admin sets for everyone. Always exactly one row.
create table public.app_settings (
  id boolean primary key default true check (id),
  -- Off hides our subtitles under the player for every user; the player's
  -- own captions show instead, and the captions route stops fetching.
  transcripts_enabled boolean not null default true,
  updated_at timestamptz not null default now()
);

insert into public.app_settings default values;

alter table public.app_settings enable row level security;

create policy "read app settings" on public.app_settings
  for select to authenticated using (true);

create policy "admin updates app settings" on public.app_settings
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
