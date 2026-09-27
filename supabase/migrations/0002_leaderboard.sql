-- Public name + opt-out for the leaderboard
alter table public.user_settings
  add column display_name text check (char_length(display_name) <= 30),
  add column show_on_leaderboard boolean not null default true;

-- Aggregated stats for every user who opted in. SECURITY DEFINER so it can read
-- across users despite RLS, but it only exposes names and totals (no ids/emails).
create function public.get_leaderboard()
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
  with totals as (
    select
      t.user_id,
      sum(t.minutes) filter (where t.kind = 'active') as active_min,
      sum(t.minutes) filter (where t.kind = 'passive') as passive_min,
      count(*) filter (where t.kind = 'anki') as anki_days
    from public.daily_tasks t
    group by t.user_id
  ),
  perfect as (
    select t.user_id, t.day
    from public.daily_tasks t
    group by t.user_id, t.day
    having count(*) >= 3
  ),
  runs as (
    -- gaps-and-islands: consecutive perfect days share the same grp
    select user_id, max(day) as last_day, count(*) as len
    from (
      select user_id, day,
        day - (row_number() over (partition by user_id order by day))::int as grp
      from perfect
    ) islands
    group by user_id, grp
  )
  select
    coalesce(nullif(trim(s.display_name), ''), 'Anonymous learner'),
    coalesce(tt.active_min, 0),
    coalesce(tt.passive_min, 0),
    coalesce(tt.anki_days, 0),
    (select count(*) from perfect p where p.user_id = s.user_id),
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

revoke execute on function public.get_leaderboard() from public, anon;
grant execute on function public.get_leaderboard() to authenticated;
