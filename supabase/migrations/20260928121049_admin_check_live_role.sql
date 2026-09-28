-- Read the admin role from auth.users rather than the JWT, so granting or
-- revoking it applies immediately instead of after the next token refresh,
-- matching the page-level check (getUser returns the live app_metadata).
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
  if not exists (
    select 1 from auth.users u
    where u.id = (select auth.uid())
      and u.raw_app_meta_data ->> 'role' = 'admin'
  ) then
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
