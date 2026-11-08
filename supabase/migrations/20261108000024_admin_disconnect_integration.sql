-- =============================================
-- Audit ADM-05 (2026-11-08): "Desconectar" no painel Meta Ads do admin.
-- O delete direto em integrations só vale para o dono (RLS), então o admin "desconectava"
-- 0 linhas e via sucesso. RPC admin-only que remove a integração e devolve erro se não existir.
-- Não retorna nenhuma coluna de token.
-- =============================================
create or replace function public.admin_disconnect_integration(p_integration_id uuid)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_user_id uuid;
  v_provider text;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delete from public.integrations i
  where i.id = p_integration_id
  returning i.user_id, i.provider into v_user_id, v_provider;

  if v_user_id is null then
    raise exception 'Integração não encontrada' using errcode = 'P0002';
  end if;

  return jsonb_build_object('id', p_integration_id, 'user_id', v_user_id, 'provider', v_provider);
end $$;
revoke all on function public.admin_disconnect_integration(uuid) from public, anon;
grant execute on function public.admin_disconnect_integration(uuid) to authenticated, service_role;
