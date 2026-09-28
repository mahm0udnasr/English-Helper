-- Lets users turn the admin's recommended (default) channels off per kind.
-- Off means Home only uses the channels they added themselves.
alter table public.user_settings
  add column show_active_defaults boolean not null default true,
  add column show_passive_defaults boolean not null default true;
