-- =============================================
-- Audit ADM-05 (2026-11-08): ativar uma configuração de IA desativa todas as outras.
-- AdminOpenAI fazia update ... .neq('provider', p).neq('model_name', m) — um AND, então outra
-- configuração do mesmo provedor (ou do mesmo modelo) continuava ativa/default.
-- Esta RPC (só super_admin, como a policy de ai_configurations) faz tudo num único UPDATE.
-- =============================================
create or replace function public.admin_set_active_ai_configuration(p_provider text, p_model_name text)
returns void
language plpgsql volatile security definer set search_path = public as $$
declare
  v_found boolean;
begin
  if not exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and ur.role = 'super_admin'
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select exists (
    select 1 from public.ai_configurations
    where provider = p_provider and model_name = p_model_name
  ) into v_found;
  if not v_found then
    raise exception 'Configuração de IA não encontrada' using errcode = 'P0002';
  end if;

  update public.ai_configurations
     set is_active  = (provider = p_provider and model_name = p_model_name),
         is_default = (provider = p_provider and model_name = p_model_name),
         updated_at = now()
   where is_active is distinct from (provider = p_provider and model_name = p_model_name)
      or is_default is distinct from (provider = p_provider and model_name = p_model_name);

end $$;
revoke all on function public.admin_set_active_ai_configuration(text, text) from public, anon;
grant execute on function public.admin_set_active_ai_configuration(text, text) to authenticated, service_role;
