-- =============================================
-- Audit LGL-03 (2026-11-09): exclusão de conta pelo titular (LGPD art. 18 VI)
-- O usuário pede a exclusão em Configurações → edge function user-account-delete, que
-- (service role) marca profiles.status = 'pending_deletion' e deletion_requested_at = now().
-- Após 30 dias, public.hard_delete_pending_accounts() (migration 20261109000003) apaga a conta.
-- Para cancelar dentro do prazo: admin volta o status para 'active' (admin_set_user_status).
--
-- deletion_requested_at entra na lista de colunas protegidas do trigger
-- profiles_guard_protected_columns (DATA-07): o próprio usuário não pode mexer nela pelo
-- PostgREST. O restante da função é idêntico ao da migration 20261108000013.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

alter table public.profiles
  add column if not exists deletion_requested_at timestamptz;

comment on column public.profiles.deletion_requested_at is
  'audit LGL-03: quando o titular pediu a exclusão da conta (status pending_deletion). Hard delete após 30 dias.';

create index if not exists profiles_pending_deletion_idx
  on public.profiles (deletion_requested_at)
  where status = 'pending_deletion';

-- guarda das colunas protegidas (NÃO é security definer: current_user precisa ser o do chamador)
create or replace function public.profiles_guard_protected_columns()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if current_user not in ('anon', 'authenticated') then
    return new;
  end if;
  if public.is_admin_or_super_admin() then
    return new;
  end if;

  if new.id                     is distinct from old.id
  or new.email                  is distinct from old.email
  or new.status                 is distinct from old.status
  or new.email_verified         is distinct from old.email_verified
  or new.locked_until           is distinct from old.locked_until
  or new.failed_login_attempts  is distinct from old.failed_login_attempts
  or new.password_reset_token   is distinct from old.password_reset_token
  or new.password_reset_expires is distinct from old.password_reset_expires
  or new.deletion_requested_at  is distinct from old.deletion_requested_at  -- audit LGL-03
  or (new.must_change_password is distinct from old.must_change_password
      and not (coalesce(old.must_change_password, false) = true and new.must_change_password = false))
  then
    raise exception 'audit DATA-07: protected profile column cannot be changed by the user'
      using errcode = '42501';
  end if;

  return new;
end $$;

revoke all on function public.profiles_guard_protected_columns() from public, anon, authenticated;
