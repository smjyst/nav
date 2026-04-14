-- NAV — Initial Schema Migration
-- Run this in the Supabase SQL editor or via `supabase db push`

-- ─────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- TYPES / ENUMS
-- ─────────────────────────────────────────────────────────────

create type guidance_mode    as enum ('beginner', 'intermediate', 'advanced');
create type risk_profile     as enum ('conservative', 'moderate', 'aggressive');
create type conviction_outlook as enum ('bull', 'neutral', 'bear');
create type conviction_confidence as enum ('low', 'medium', 'high');
create type alert_type as enum (
  'conviction_change', 'price_threshold', 'whale_movement',
  'risk_level', 'portfolio_health', 'scam_detection'
);
create type alert_severity as enum ('info', 'warning', 'critical');
create type hold_sell_signal as enum ('strong_hold', 'hold', 'neutral', 'sell', 'strong_sell');
create type whale_tier as enum ('retail', 'mid', 'whale', 'mega_whale');
create type transaction_type as enum ('buy', 'sell', 'transfer_in', 'transfer_out');
create type risk_level as enum ('low', 'medium', 'high', 'critical');

-- ─────────────────────────────────────────────────────────────
-- PROFILES  (extends auth.users)
-- ─────────────────────────────────────────────────────────────

create table profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  email                 text not null,
  display_name          text,
  guidance_mode         guidance_mode not null default 'beginner',
  risk_profile          risk_profile not null default 'moderate',
  onboarding_completed  boolean not null default false,
  briefing_enabled      boolean not null default true,
  briefing_time         text not null default '08:00',
  timezone              text not null default 'UTC',
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Users read and write own profile"
  on profiles for all
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Auto-create profile on auth.users insert
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- PORTFOLIOS
-- ─────────────────────────────────────────────────────────────

create table portfolios (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  name        text not null default 'My Portfolio',
  is_default  boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table portfolios enable row level security;
create policy "Users own their portfolios"
  on portfolios for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on portfolios(user_id);

-- ─────────────────────────────────────────────────────────────
-- HOLDINGS
-- ─────────────────────────────────────────────────────────────

create table holdings (
  id                uuid primary key default gen_random_uuid(),
  portfolio_id      uuid not null references portfolios(id) on delete cascade,
  coin_id           text not null,
  symbol            text not null,
  name              text not null,
  quantity          numeric(28, 10) not null check (quantity > 0),
  average_buy_price numeric(28, 10),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique(portfolio_id, coin_id)
);

alter table holdings enable row level security;
create policy "Users own their holdings"
  on holdings for all
  using (
    exists (
      select 1 from portfolios p
      where p.id = portfolio_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from portfolios p
      where p.id = portfolio_id and p.user_id = auth.uid()
    )
  );

create index on holdings(portfolio_id);

create trigger holdings_updated_at
  before update on holdings
  for each row execute function update_updated_at();

-- ─────────────────────────────────────────────────────────────
-- TRANSACTIONS
-- ─────────────────────────────────────────────────────────────

create table transactions (
  id              uuid primary key default gen_random_uuid(),
  portfolio_id    uuid not null references portfolios(id) on delete cascade,
  coin_id         text not null,
  type            transaction_type not null,
  quantity        numeric(28, 10) not null check (quantity > 0),
  price_usd       numeric(28, 10) not null check (price_usd >= 0),
  fee_usd         numeric(28, 10) not null default 0 check (fee_usd >= 0),
  transacted_at   timestamptz not null,
  notes           text,
  created_at      timestamptz not null default now()
);

alter table transactions enable row level security;
create policy "Users own their transactions"
  on transactions for all
  using (
    exists (
      select 1 from portfolios p
      where p.id = portfolio_id and p.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from portfolios p
      where p.id = portfolio_id and p.user_id = auth.uid()
    )
  );

create index on transactions(portfolio_id, transacted_at desc);

-- ─────────────────────────────────────────────────────────────
-- WATCHLISTS
-- ─────────────────────────────────────────────────────────────

create table watchlists (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references profiles(id) on delete cascade,
  coin_id  text not null,
  symbol   text not null,
  name     text not null,
  added_at timestamptz not null default now(),
  unique(user_id, coin_id)
);

alter table watchlists enable row level security;
create policy "Users own their watchlist"
  on watchlists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on watchlists(user_id);

-- ─────────────────────────────────────────────────────────────
-- CONVICTION SCORES  (shared cache — public read)
-- ─────────────────────────────────────────────────────────────

create table conviction_scores (
  id             uuid primary key default gen_random_uuid(),
  coin_id        text not null,
  symbol         text not null,
  outlook        conviction_outlook not null,
  score          integer not null check (score between 0 and 100),
  confidence     conviction_confidence not null,
  confidence_pct integer check (confidence_pct between 0 and 100),
  headline       text not null,
  summary        text not null,
  bull_case      text,
  bear_case      text,
  signals        jsonb not null default '{}',
  computed_at    timestamptz not null default now(),
  valid_until    timestamptz not null,
  data_sources   text[] not null default '{}'
);

alter table conviction_scores enable row level security;

-- Anyone can read conviction scores (shared cache)
create policy "Public read conviction scores"
  on conviction_scores for select
  using (true);

-- Only service role can write (Edge Functions)
create policy "Service role writes conviction scores"
  on conviction_scores for insert
  with check (auth.role() = 'service_role');

create index on conviction_scores(coin_id, computed_at desc);
create index on conviction_scores(coin_id) where valid_until > now();

-- ─────────────────────────────────────────────────────────────
-- ALERT CONFIGS
-- ─────────────────────────────────────────────────────────────

create table alert_configs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  coin_id     text,
  alert_type  alert_type not null,
  config      jsonb not null default '{}',
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table alert_configs enable row level security;
create policy "Users own their alert configs"
  on alert_configs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────
-- ALERT EVENTS
-- ─────────────────────────────────────────────────────────────

create table alert_events (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  alert_config_id  uuid references alert_configs(id) on delete set null,
  coin_id          text,
  alert_type       text not null,
  severity         alert_severity not null,
  title            text not null,
  body             text not null,
  payload          jsonb not null default '{}',
  is_read          boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table alert_events enable row level security;
create policy "Users read own alerts"
  on alert_events for select
  using (auth.uid() = user_id);
create policy "Users update own alerts (mark read)"
  on alert_events for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
create policy "Service role inserts alerts"
  on alert_events for insert
  with check (auth.role() = 'service_role');

create index on alert_events(user_id, is_read, created_at desc);
create index on alert_events(user_id, created_at desc);

-- ─────────────────────────────────────────────────────────────
-- DAILY BRIEFINGS  (one per user per day)
-- ─────────────────────────────────────────────────────────────

create table daily_briefings (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  briefing_date date not null,
  content       jsonb not null,
  generated_at  timestamptz not null default now(),
  unique(user_id, briefing_date)
);

alter table daily_briefings enable row level security;
create policy "Users read own briefings"
  on daily_briefings for select
  using (auth.uid() = user_id);
create policy "Service role writes briefings"
  on daily_briefings for insert
  with check (auth.role() = 'service_role');

create index on daily_briefings(user_id, briefing_date desc);

-- ─────────────────────────────────────────────────────────────
-- TOKEN SCANS  (Validate Before You Buy history)
-- ─────────────────────────────────────────────────────────────

create table token_scans (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references profiles(id) on delete cascade,
  input                 text not null,
  chain                 text,
  coin_id               text,
  legitimacy_score      integer check (legitimacy_score between 0 and 100),
  risk_level            risk_level,
  red_flags             text[] not null default '{}',
  green_flags           text[] not null default '{}',
  timing_assessment     text,
  summary               text,
  raw_data              jsonb not null default '{}',
  scanned_at            timestamptz not null default now()
);

alter table token_scans enable row level security;
create policy "Users own their token scans"
  on token_scans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on token_scans(user_id, scanned_at desc);

-- ─────────────────────────────────────────────────────────────
-- WALLET ANALYSES
-- ─────────────────────────────────────────────────────────────

create table wallet_analyses (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references profiles(id) on delete cascade,
  wallet_address      text not null,
  chain               text not null default 'ethereum',
  portfolio_value_usd numeric(28, 10),
  first_tx_at         timestamptz,
  wallet_age_days     integer,
  top_holdings        jsonb not null default '[]',
  estimated_roi_pct   numeric(10, 4),
  hold_sell_signal    hold_sell_signal,
  whale_tier          whale_tier,
  summary             text,
  raw_data            jsonb not null default '{}',
  analyzed_at         timestamptz not null default now()
);

alter table wallet_analyses enable row level security;
create policy "Users own their wallet analyses"
  on wallet_analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on wallet_analyses(user_id, analyzed_at desc);

-- ─────────────────────────────────────────────────────────────
-- COPILOT CONVERSATIONS  (optional persistence)
-- ─────────────────────────────────────────────────────────────

create table copilot_conversations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references profiles(id) on delete cascade,
  messages         jsonb not null default '[]',
  context_type     text,
  context_id       text,
  started_at       timestamptz not null default now(),
  last_message_at  timestamptz not null default now()
);

alter table copilot_conversations enable row level security;
create policy "Users own their conversations"
  on copilot_conversations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on copilot_conversations(user_id, last_message_at desc);
