-- Extra videos watched beyond the daily target. Each counts toward the
-- active/passive totals (and the leaderboard) without changing the goal.
create table public.extra_study (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  day date not null,
  kind text not null check (kind in ('active', 'passive')),
  video_id text not null,
  title text not null,
  channel_title text not null default '',
  minutes int not null check (minutes between 1 and 600),
  created_at timestamptz not null default now(),
  primary key (user_id, day, kind, video_id)
);

alter table public.extra_study enable row level security;

create policy "own extra study" on public.extra_study
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- Leaderboard totals now include extra minutes.
create or replace function public.get_leaderboard()
returns table (
  display_name text,
  active_min bigint,
  passive_min bigint,
  anki_days bigint,
  perfect_days bigint,
  current_streak bigint,
  is_me boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  with minutes as (
    select user_id, kind, minutes from public.daily_tasks
    union all
    select user_id, kind, minutes from public.extra_study
  ),
  totals as (
    select
      m.user_id,
      sum(m.minutes) filter (where m.kind = 'active') as active_min,
      sum(m.minutes) filter (where m.kind = 'passive') as passive_min,
      count(*) filter (where m.kind = 'anki') as anki_days
    from minutes m
    group by m.user_id
  ),
  days as (
    select t.user_id, t.day, count(*) as tasks
    from public.daily_tasks t
    group by t.user_id, t.day
  ),
  runs as (
    -- gaps-and-islands: consecutive studied days share the same grp
    select user_id, max(day) as last_day, count(*) as len
    from (
      select user_id, day,
        day - (row_number() over (partition by user_id order by day))::int as grp
      from days
    ) islands
    group by user_id, grp
  )
  select
    coalesce(nullif(trim(s.display_name), ''), 'Anonymous learner'),
    coalesce(tt.active_min, 0),
    coalesce(tt.passive_min, 0),
    coalesce(tt.anki_days, 0),
    (select count(*) from days d where d.user_id = s.user_id and d.tasks >= 3),
    coalesce((
      select r.len from runs r
      where r.user_id = s.user_id
        and r.last_day >= (now() at time zone s.timezone)::date - 1
      order by r.last_day desc
      limit 1
    ), 0),
    s.user_id = (select auth.uid())
  from public.user_settings s
  join totals tt on tt.user_id = s.user_id
  where (select auth.uid()) is not null
    and (s.show_on_leaderboard or s.user_id = (select auth.uid()))
$$;
