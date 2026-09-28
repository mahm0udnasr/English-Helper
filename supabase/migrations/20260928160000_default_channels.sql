-- Channels the admin sets up for everyone. Active ones go to every user
-- (who can hide some); passive ones are grouped into categories, and users
-- get the channels in the categories they pick. The per-user "channels"
-- table stays for channels users add themselves.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) between 1 and 40),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table public.default_channels (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('active', 'passive')),
  category_id uuid references public.categories (id) on delete cascade,
  youtube_channel_id text not null,
  title text not null,
  thumbnail_url text,
  created_at timestamptz not null default now(),
  -- Passive channels always belong to a category; active ones never do.
  check ((kind = 'passive') = (category_id is not null)),
  unique (kind, youtube_channel_id)
);

create index on public.default_channels (category_id);

create table public.user_categories (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (user_id, category_id)
);

create index on public.user_categories (category_id);

create table public.hidden_default_channels (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  default_channel_id uuid not null references public.default_channels (id) on delete cascade,
  primary key (user_id, default_channel_id)
);

create index on public.hidden_default_channels (default_channel_id);

alter table public.categories enable row level security;
alter table public.default_channels enable row level security;
alter table public.user_categories enable row level security;
alter table public.hidden_default_channels enable row level security;

create policy "read categories" on public.categories
  for select to authenticated using (true);

create policy "admin inserts categories" on public.categories
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin updates categories" on public.categories
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin deletes categories" on public.categories
  for delete to authenticated using ((select public.is_admin()));

create policy "read default channels" on public.default_channels
  for select to authenticated using (true);

create policy "admin inserts default channels" on public.default_channels
  for insert to authenticated with check ((select public.is_admin()));
create policy "admin updates default channels" on public.default_channels
  for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin deletes default channels" on public.default_channels
  for delete to authenticated using ((select public.is_admin()));

create policy "own categories" on public.user_categories
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own hidden channels" on public.hidden_default_channels
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
