-- WhatsApp campaign bot (docs/whatsapp-campaign-bot-plan.md §6).
-- All four tables are service-role only: the browser never reads them directly (the Settings card
-- talks to the wa-bot-link function). RLS is enabled with no policies = deny for anon/authenticated.

-- 1) Phone ↔ account link -------------------------------------------------------------------------
create table if not exists public.wa_bot_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  wa_id text,                                   -- digits, exactly as Meta sends it
  phone_masked text,                            -- '+55 •• •••• 1234' (UI)
  status text not null default 'pending' check (status in ('pending','active','revoked')),
  code_hash text,                               -- sha256 of the 8-digit link code (never the code)
  code_expires_at timestamptz,
  max_daily_budget numeric(10,2) check (max_daily_budget is null or max_daily_budget >= 30),
  opted_out_at timestamptz,                     -- user sent "parar"
  linked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
-- one pending/active link per account, one active account per WhatsApp number
create unique index if not exists wa_bot_links_user_open on public.wa_bot_links(user_id) where status in ('pending','active');
create unique index if not exists wa_bot_links_waid_active on public.wa_bot_links(wa_id) where status = 'active';
create unique index if not exists wa_bot_links_code_pending on public.wa_bot_links(code_hash) where status = 'pending';

-- 2) Conversation state: one row per WhatsApp number, reset to IDLE between flows ---------------
create table if not exists public.wa_bot_sessions (
  id uuid primary key default gen_random_uuid(),
  wa_id text not null unique,
  user_id uuid references auth.users(id) on delete cascade,
  state text not null default 'IDLE',
  draft jsonb not null default '{}'::jsonb,
  draft_version int not null default 0,
  retries int not null default 0,               -- consecutive unparseable answers in this state
  last_inbound_at timestamptz,                  -- start of the 24 h customer-service window
  last_unknown_reply_at timestamptz,            -- "unlinked number" reply at most once a day
  locked_until timestamptz,                     -- worker lock (see wa_bot_claim_session)
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- 3) Inbound/outbound message log (dedupe + audit). Bodies purged after 90 days (sweep). ---------
create table if not exists public.wa_bot_messages (
  id bigint generated always as identity primary key,
  wamid text unique,                            -- Meta message id
  direction text not null check (direction in ('in','out')),
  wa_id text not null,
  user_id uuid references auth.users(id) on delete set null,
  msg_type text,
  body jsonb,                                   -- redacted payload; never tokens
  wa_timestamp timestamptz,                     -- Meta's timestamp (ordering)
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  status text,                                  -- out: sent/delivered/read/failed
  error text
);
create index if not exists wa_bot_messages_pending on public.wa_bot_messages(wa_id, wa_timestamp)
  where direction = 'in' and processed_at is null;
create index if not exists wa_bot_messages_waid_time on public.wa_bot_messages(wa_id, received_at desc);
create index if not exists wa_bot_messages_user on public.wa_bot_messages(user_id);

-- 4) Long-running work (campaign creation / activation) -----------------------------------------
create table if not exists public.wa_bot_jobs (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references public.wa_bot_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  wa_id text not null,
  kind text not null check (kind in ('create_campaign','activate_campaign')),
  status text not null default 'pending'
    check (status in ('pending','running','done','failed','failed_unknown')),
  attempts int not null default 0,
  payload jsonb,
  result jsonb,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists wa_bot_jobs_open on public.wa_bot_jobs(status, created_at) where status in ('pending','running');
create index if not exists wa_bot_jobs_user on public.wa_bot_jobs(user_id);

-- RLS on, no policies → anon/authenticated get nothing; plus explicit revokes.
alter table public.wa_bot_links enable row level security;
alter table public.wa_bot_sessions enable row level security;
alter table public.wa_bot_messages enable row level security;
alter table public.wa_bot_jobs enable row level security;
revoke all on public.wa_bot_links, public.wa_bot_sessions, public.wa_bot_messages, public.wa_bot_jobs from anon, authenticated;
revoke all on sequence public.wa_bot_messages_id_seq from anon, authenticated;

-- Worker lock: creates the session row if missing and takes a short lock on it.
-- Returns the session id when the lock was acquired, NULL when another worker holds it.
create or replace function public.wa_bot_claim_session(p_wa_id text, p_lock_seconds int default 120)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.wa_bot_sessions (wa_id) values (p_wa_id) on conflict (wa_id) do nothing;
  update public.wa_bot_sessions
     set locked_until = now() + make_interval(secs => greatest(10, least(p_lock_seconds, 600)))
   where wa_id = p_wa_id and (locked_until is null or locked_until < now())
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.wa_bot_release_session(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$ update public.wa_bot_sessions set locked_until = null where id = p_id; $$;

revoke all on function public.wa_bot_claim_session(text, int) from public, anon, authenticated;
revoke all on function public.wa_bot_release_session(uuid) from public, anon, authenticated;
grant execute on function public.wa_bot_claim_session(text, int) to service_role;
grant execute on function public.wa_bot_release_session(uuid) to service_role;

-- media_files.source = 'whatsapp' is a plain text value (no constraint change needed).
