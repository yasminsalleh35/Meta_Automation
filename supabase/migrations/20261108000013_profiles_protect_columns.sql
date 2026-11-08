-- =============================================
-- Audit DATA-07 (2026-11-08): usuário não pode alterar colunas sensíveis do próprio perfil
-- As policies profiles_self_update / "Users can update their own profile" (auth.uid() = id)
-- permitiam ao próprio usuário mudar status (des-suspender), email_verified, locked_until,
-- failed_login_attempts, password_reset_*, must_change_password e email.
--
-- Regra (trigger BEFORE UPDATE): quando o UPDATE vem direto de um cliente PostgREST
-- (current_user anon/authenticated) e o chamador não é admin, as colunas protegidas não
-- podem mudar. Exceção: must_change_password true -> false.
-- Ficam liberados: service_role, funções SECURITY DEFINER (rodam como owner, p.ex.
-- set_must_change_password, o RPC admin de status, sync de e-mail abaixo) e admins.
--
-- E-mail: a tela de perfil passa a trocar o e-mail via supabase.auth.updateUser (com
-- confirmação); profiles.email é sincronizado a partir de auth.users pelo trigger abaixo.
--
-- Também remove as policies de INSERT/DELETE do próprio perfil: o cliente nunca faz isso
-- (perfil é criado por handle_new_user / service_role) e apagar + recriar o perfil
-- permitia contornar status/email_verified.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

-- 1. guarda das colunas protegidas (NÃO é security definer: current_user precisa ser o do chamador)
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
  or (new.must_change_password is distinct from old.must_change_password
      and not (coalesce(old.must_change_password, false) = true and new.must_change_password = false))
  then
    raise exception 'audit DATA-07: protected profile column cannot be changed by the user'
      using errcode = '42501';
  end if;

  return new;
end $$;

revoke all on function public.profiles_guard_protected_columns() from public, anon, authenticated;

drop trigger if exists profiles_guard_protected_columns on public.profiles;
create trigger profiles_guard_protected_columns
  before update on public.profiles
  for each row execute function public.profiles_guard_protected_columns();

-- 2. policies de INSERT/DELETE do próprio perfil (sem uso no cliente)
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can delete their own profile" on public.profiles;

-- 3. profiles.email / email_verified acompanham auth.users (fonte confiável)
create or replace function public.sync_profile_from_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
     set email          = coalesce(new.email, email),
         email_verified = (new.email_confirmed_at is not null)
   where id = new.id
     and (email is distinct from coalesce(new.email, email)
          or email_verified is distinct from (new.email_confirmed_at is not null));
  return new;
end $$;

revoke all on function public.sync_profile_from_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_email_updated on auth.users;
create trigger on_auth_user_email_updated
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.sync_profile_from_auth_user();
