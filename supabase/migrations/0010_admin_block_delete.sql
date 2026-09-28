-- Admin checks read the role from auth.users rather than the JWT, so granting
-- or revoking it applies immediately instead of after the next token refresh,
-- matching the page-level check (getUser returns the live app_metadata).
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from auth.users u
    where u.id = (select auth.uid())
      and u.raw_app_meta_data ->> 'role' = 'admin'
  )
$$;

revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- The return type gains "blocked", so the function has to be recreated.
drop function public.admin_list_users();

create function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  display_name text,
  provider text,
  timezone text,
  created_at timestamptz,
  last_sign_in_at timestamptz,
  blocked boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    s.display_name,
    u.raw_app_meta_data ->> 'provider',
    s.timezone,
    u.created_at,
    u.last_sign_in_at,
    coalesce(u.banned_until > now(), false)
  from auth.users u
  left join public.user_settings s on s.user_id = u.id
  order by u.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;

-- Blocked users can't sign in or refresh their session; an access token they
-- already hold keeps working until it expires (an hour by default).
create or replace function public.admin_set_user_blocked(p_user_id uuid, p_blocked boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'You can''t block yourself.';
  end if;

  update auth.users
  set banned_until = case when p_blocked then 'infinity'::timestamptz end
  where id = p_user_id;
end;
$$;

revoke execute on function public.admin_set_user_blocked(uuid, boolean) from public, anon;
grant execute on function public.admin_set_user_blocked(uuid, boolean) to authenticated;

-- Every table references auth.users with on delete cascade, so this also
-- removes the user's settings, channels, tasks and push subscriptions.
create or replace function public.admin_delete_user(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  if p_user_id = (select auth.uid()) then
    raise exception 'You can''t delete yourself.';
  end if;

  delete from auth.users where id = p_user_id;
end;
$$;

revoke execute on function public.admin_delete_user(uuid) from public, anon;
grant execute on function public.admin_delete_user(uuid) to authenticated;
