-- Run once if your accounts table was created before channel switching.
alter table public.accounts
  add column if not exists youtube_channels jsonb not null default '[]'::jsonb;
