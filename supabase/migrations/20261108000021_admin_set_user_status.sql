-- =============================================
-- Audit ADM-02 (2026-11-08): suspender / reativar usuário de verdade.
-- Não existe policy de UPDATE para admin em profiles, então o update do painel afetava 0 linhas e
-- a UI mostrava sucesso. Esta RPC (SECURITY DEFINER, só admins) altera profiles.status e devolve
-- erro explícito quando o usuário não existe. O trigger de colunas protegidas de profiles (DATA-07)
-- permite a mudança porque o chamador é admin.
-- =============================================
create or replace function public.admin_set_user_status(uid uuid, new_status text)
returns jsonb
language plpgsql volatile security definer set search_path = public as $$
declare
  v_status text := lower(btrim(coalesce(new_status, '')));
  v_updated int;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if uid is null then
    raise exception 'Usuário não informado' using errcode = '22023';
  end if;
  if v_status not in ('active', 'suspended') then
    raise exception 'Status inválido: %', new_status using errcode = '22023';
  end if;
  if uid = auth.uid() and v_status = 'suspended' then
    raise exception 'Você não pode suspender a própria conta' using errcode = '22023';
  end if;

  update public.profiles
     set status = v_status,
         updated_at = now()
   where id = uid;
  get diagnostics v_updated = row_count;

  if v_updated = 0 then
    raise exception 'Usuário não encontrado' using errcode = 'P0002';
  end if;

  return jsonb_build_object('id', uid, 'status', v_status);
end $$;
revoke all on function public.admin_set_user_status(uuid, text) from public, anon;
grant execute on function public.admin_set_user_status(uuid, text) to authenticated, service_role;
