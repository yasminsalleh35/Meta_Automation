-- =============================================
-- Audit DATA-07 (2026-11-08): escalada de privilégio em user_roles
-- "Admins can insert roles" / "Admins can update roles" deixavam qualquer admin
-- inserir/alterar papéis, inclusive se promover a super_admin.
-- Agora só super_admin escreve em user_roles. O cliente não escreve nessa tabela;
-- papéis de novos usuários vêm de handle_new_user (security definer) / service_role.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
     where user_id = auth.uid() and role = 'super_admin'::app_role
  );
$$;

revoke all on function public.is_super_admin() from public, anon;
grant execute on function public.is_super_admin() to authenticated;

drop policy if exists "Admins can insert roles" on public.user_roles;
drop policy if exists "Admins can update roles" on public.user_roles;
drop policy if exists "user_roles_super_admin_insert" on public.user_roles;
drop policy if exists "user_roles_super_admin_update" on public.user_roles;
drop policy if exists "user_roles_super_admin_delete" on public.user_roles;

create policy "user_roles_super_admin_insert" on public.user_roles
  for insert to authenticated
  with check (public.is_super_admin());

create policy "user_roles_super_admin_update" on public.user_roles
  for update to authenticated
  using (public.is_super_admin())
  with check (public.is_super_admin());

create policy "user_roles_super_admin_delete" on public.user_roles
  for delete to authenticated
  using (public.is_super_admin());
