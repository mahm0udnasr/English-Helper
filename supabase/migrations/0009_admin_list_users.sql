-- Every user for the admin dashboard. Admins are marked by app_metadata.role,
-- which only the service role can set, so users can't grant it to themselves.
create or replace function public.admin_list_users()
returns table (
  user_id uuid,
  email text,
  display_name text,
  provider text,
  timezone text,
  created_at timestamptz,
  last_sign_in_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if coalesce((select auth.jwt()) -> 'app_metadata' ->> 'role', '') <> 'admin' then
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
    u.last_sign_in_at
  from auth.users u
  left join public.user_settings s on s.user_id = u.id
  order by u.created_at desc;
end;
$$;

revoke execute on function public.admin_list_users() from public, anon;
grant execute on function public.admin_list_users() to authenticated;
