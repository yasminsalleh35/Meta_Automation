-- =============================================
-- Audit SEC-14 (2026-11-02): proteção CSRF do OAuth Meta
-- O navegador registra um state aleatório (só o próprio user_id, sem leitura);
-- meta-oauth-exchange (service role) consome o state uma única vez, válido por 15 min.
-- =============================================
begin;

create table if not exists public.oauth_states (
  state text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'meta_ads',
  created_at timestamptz not null default now()
);
create index if not exists oauth_states_user_idx on public.oauth_states (user_id, created_at desc);

alter table public.oauth_states enable row level security;

drop policy if exists oauth_states_insert_own on public.oauth_states;
create policy oauth_states_insert_own on public.oauth_states
  for insert to authenticated
  with check (user_id = auth.uid() and length(state) between 32 and 128);
-- sem SELECT/UPDATE/DELETE para authenticated: só service_role lê/consome

revoke all on public.oauth_states from anon;
grant insert on public.oauth_states to authenticated;

commit;
