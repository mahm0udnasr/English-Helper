-- Google sign-ups carry full_name/name instead of display_name, and no
-- timezone (TimezoneNotice prompts them to fix the UTC default).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := nullif(left(trim(coalesce(
    new.raw_user_meta_data ->> 'display_name',
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name'
  )), 30), '');
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
