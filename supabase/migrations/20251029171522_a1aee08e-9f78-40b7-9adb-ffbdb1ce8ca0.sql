-- Migration: Cache de insights da conta Meta (account-level)
-- Propósito: Armazenar métricas agregadas por período para evitar chamadas excessivas à API

create table if not exists public.account_insights_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ad_account_id text not null,
  date_preset text not null check (date_preset in ('today','last_7d','last_30d')),
  impressions bigint not null default 0,
  reach bigint not null default 0,
  clicks bigint not null default 0,
  spend numeric(14,2) not null default 0,
  actions jsonb default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  unique (user_id, ad_account_id, date_preset)
);

comment on table public.account_insights_cache is 'Cache de métricas da conta inteira por período (today, last_7d, last_30d)';
comment on column public.account_insights_cache.actions is 'Array de ações do Meta (ex: onsite_conversion.messaging_first_reply)';

-- RLS policies
alter table public.account_insights_cache enable row level security;

create policy "select_own_cache"
on public.account_insights_cache
for select 
using (auth.uid() = user_id);

-- Índice para queries otimizadas
create index if not exists idx_acc_cache_user_period
  on public.account_insights_cache(user_id, date_preset);

create index if not exists idx_acc_cache_updated
  on public.account_insights_cache(updated_at desc);