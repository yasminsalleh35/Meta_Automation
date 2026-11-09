-- =============================================
-- Audit LGL-02 (2026-11-09): registro de consentimento de cookies.
-- O banner grava o consentimento no localStorage e, best-effort, aqui
-- (anônimo via anon_id ou vinculado ao usuário logado).
-- Linhas são apenas inseridas (histórico/prova de consentimento); sem update/delete pelo cliente.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

create table if not exists public.cookie_consents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid null references auth.users(id) on delete cascade,
  anon_id        text,
  consent        jsonb not null,
  policy_version text not null,
  created_at     timestamptz default now()
);

create index if not exists cookie_consents_user_id_idx on public.cookie_consents (user_id);
create index if not exists cookie_consents_anon_id_idx on public.cookie_consents (anon_id);

alter table public.cookie_consents enable row level security;

drop policy if exists cookie_consents_insert on public.cookie_consents;
create policy cookie_consents_insert
  on public.cookie_consents
  for insert
  to anon, authenticated
  with check (user_id is null or user_id = auth.uid());

drop policy if exists cookie_consents_select on public.cookie_consents;
create policy cookie_consents_select
  on public.cookie_consents
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin_or_super_admin());

revoke all on public.cookie_consents from anon, authenticated;
grant insert on public.cookie_consents to anon, authenticated;
grant select on public.cookie_consents to authenticated;

comment on table public.cookie_consents is
  'Audit LGL-02: histórico de consentimentos de cookies (versão da política, escolhas, data).';
