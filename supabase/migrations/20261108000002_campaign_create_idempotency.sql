-- =============================================
-- Audit CMP-08 (2026-11-08): criação idempotente de campanhas.
-- O wizard gera um idempotencyKey ao abrir; o simple-campaign-create "reivindica" a chave antes de
-- tocar na Meta. Duplo clique / refresh durante a criação → 409 ou a resposta já gravada.
-- Só a service role acessa (RLS ligada, sem policies).
-- =============================================
create table if not exists public.campaign_create_requests (
  user_id uuid not null references auth.users(id) on delete cascade,
  idempotency_key text not null check (length(idempotency_key) between 8 and 100),
  status text not null default 'in_progress' check (status in ('in_progress', 'done', 'failed')),
  response jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);
alter table public.campaign_create_requests enable row level security;
revoke all on public.campaign_create_requests from anon, authenticated;

alter table public.campaigns add column if not exists client_request_id text;
create unique index if not exists campaigns_user_client_request_unique
  on public.campaigns (user_id, client_request_id) where client_request_id is not null;
