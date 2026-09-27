-- Everyone is on the leaderboard by name; users can opt to appear anonymously.
alter table public.user_settings
  add column leaderboard_anonymous boolean not null default false;

update public.user_settings set leaderboard_anonymous = not show_on_leaderboard;

alter table public.user_settings drop column show_on_leaderboard;

-- Sign-up passes display_name (and the browser timezone) as user metadata,
-- so settings are filled even when email confirmation delays the session.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 30), '');
  v_tz text := new.raw_user_meta_data ->> 'timezone';
begin
  if v_tz is null or not exists (select 1 from pg_catalog.pg_timezone_names z where z.name = v_tz) then
    v_tz := 'UTC';
  end if;

  insert into public.user_settings (user_id, display_name, timezone)
  values (new.id, v_name, v_tz);
  return new;
end;
$$;

revoke execute on function public.handle_new_user() from public, anon, authenticated;

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
    case
      -- Anonymous users still see their own name (flagged "You" in the UI)
      when s.leaderboard_anonymous and s.user_id <> (select auth.uid())
        then 'Anonymous learner'
      else coalesce(nullif(trim(s.display_name), ''), 'Anonymous learner')
    end,
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
$$;
