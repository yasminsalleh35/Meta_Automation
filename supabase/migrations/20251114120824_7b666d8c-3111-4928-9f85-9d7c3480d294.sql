-- Adicionar política RLS para permitir admins visualizarem todos os perfis
create policy "Admins can view all profiles"
on public.profiles
for select
to authenticated
using (
  exists (
    select 1 
    from public.user_roles 
    where user_roles.user_id = auth.uid() 
    and user_roles.role in ('admin'::app_role, 'super_admin'::app_role)
  )
);