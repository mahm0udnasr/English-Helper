-- Per-user settings (one row per user, created automatically on sign up)
create table public.user_settings (
  user_id uuid primary key references auth.users (id) on delete cascade,
  active_goal_min int not null default 30 check (active_goal_min between 1 and 1440),
  passive_goal_min int not null default 60 check (passive_goal_min between 1 and 1440),
  videos_per_channel int not null default 6 check (videos_per_channel between 1 and 50),
  timezone text not null default 'UTC',
  updated_at timestamptz not null default now()
);

-- YouTube channels grouped as active or passive immersion
create table public.channels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind text not null check (kind in ('active', 'passive')),
  youtube_channel_id text not null,
  title text not null,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  unique (user_id, youtube_channel_id, kind)
);

-- One row per completed task per day (row exists = done)
create table public.daily_tasks (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('anki', 'active', 'passive')),
  minutes int not null default 0 check (minutes >= 0),
  completed_at timestamptz not null default now(),
  primary key (user_id, day, kind)
);

alter table public.user_settings enable row level security;
alter table public.channels enable row level security;
alter table public.daily_tasks enable row level security;

create policy "own settings" on public.user_settings
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own channels" on public.channels
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own tasks" on public.daily_tasks
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Create default settings when a user signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.user_settings (user_id) values (new.id);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
