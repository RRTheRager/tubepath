-- Multi-Google-account support. Run once if upgrading an existing database.

-- Active Google login pointer on the TubePath account.
alter table public.accounts
  add column if not exists active_google_account_id text;

-- One row per connected Google login (OAuth tokens + cached channel list).
create table if not exists public.google_accounts (
  id                  text primary key,
  account_id          text not null references public.accounts(id) on delete cascade,
  google_sub          text not null,
  email               text not null default '',
  name                text not null default '',
  picture_url         text not null default '',
  refresh_token       text not null,
  access_token        text,
  access_token_expiry bigint,
  youtube_channels    jsonb not null default '[]'::jsonb,
  active_channel_id   text,
  updated_at          timestamptz not null default now(),
  unique (account_id, google_sub)
);

drop trigger if exists google_accounts_set_updated_at on public.google_accounts;
create trigger google_accounts_set_updated_at
  before update on public.google_accounts
  for each row execute function public.set_updated_at();

alter table public.google_accounts enable row level security;

-- Migrate legacy single-row youtube_credentials into google_accounts.
insert into public.google_accounts (
  id,
  account_id,
  google_sub,
  email,
  name,
  refresh_token,
  access_token,
  access_token_expiry
)
select
  gen_random_uuid()::text,
  yc.account_id,
  'legacy',
  coalesce(a.email, ''),
  coalesce(a.name, 'Google account'),
  yc.refresh_token,
  yc.access_token,
  yc.access_token_expiry
from public.youtube_credentials yc
left join public.accounts a on a.id = yc.account_id
where not exists (
  select 1 from public.google_accounts ga where ga.account_id = yc.account_id
);

update public.accounts a
set active_google_account_id = (
  select ga.id from public.google_accounts ga
  where ga.account_id = a.id
  order by ga.updated_at desc
  limit 1
)
where a.active_google_account_id is null
  and exists (select 1 from public.google_accounts ga where ga.account_id = a.id);
