-- Off hides a default channel from every user without deleting it, so the
-- admin can bring it back later (and users' own hide choices are kept).
alter table public.default_channels
  add column enabled boolean not null default true;
