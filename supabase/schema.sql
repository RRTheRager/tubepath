-- TubePath database schema
-- Run this once in the Supabase SQL editor (or psql) to create the tables the
-- app reads/writes through the SupabaseStorage backend.
--
-- These tables are accessed only from the server using the SERVICE ROLE key,
-- so Row Level Security is enabled with no public policies (full lockdown for
-- anon/auth clients; the service role bypasses RLS).

-- ---------------------------------------------------------------------------
-- accounts: one row per session/user, holds subscription + connection state.
-- ---------------------------------------------------------------------------
create table if not exists public.accounts (
  id                      text primary key,
  email                   text,
  name                    text not null default 'Demo Creator',
  status                  text not null default 'none',
  trial_end               timestamptz,
  current_period_end      timestamptz,
  grace_ends_at           timestamptz,
  cancel_at_period_end    boolean not null default false,
  youtube_connected       boolean not null default false,
  streak                  integer not null default 4,
  stripe_customer_id      text,
  stripe_subscription_id  text,
  youtube_channel_id        text,
  youtube_channels          jsonb not null default '[]'::jsonb,
  active_google_account_id  text,
  updated_at                timestamptz not null default now()
);

-- Keep updated_at fresh on writes.
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- google_accounts: one row per connected Google login (multi-account support).
-- OAuth tokens never sent to the client.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- youtube_credentials: DEPRECATED — use google_accounts. Kept for migration.
-- ---------------------------------------------------------------------------
create table if not exists public.youtube_credentials (
  account_id            text primary key references public.accounts(id) on delete cascade,
  refresh_token         text not null,
  access_token          text,
  access_token_expiry   bigint,
  updated_at            timestamptz not null default now()
);

drop trigger if exists credentials_set_updated_at on public.youtube_credentials;
create trigger credentials_set_updated_at
  before update on public.youtube_credentials
  for each row execute function public.set_updated_at();

-- Lock down: enable RLS, add no policies. The service-role key (used by the
-- server) bypasses RLS; anon/auth clients get zero access.
alter table public.accounts enable row level security;
alter table public.google_accounts enable row level security;
alter table public.youtube_credentials enable row level security;
