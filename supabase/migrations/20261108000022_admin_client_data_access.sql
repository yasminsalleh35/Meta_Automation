-- =============================================
-- Audit ADM-03 (2026-11-08): páginas admin "Negócios dos Clientes", "Campanhas dos Clientes" e
-- "Notificações" só mostravam as linhas do próprio admin (RLS apenas do dono).
--   * business_settings: SELECT para admins (tabela sem tokens).
--   * notifications: admins podem enviar (INSERT), marcar como lida (UPDATE) e excluir (DELETE)
--     notificações de qualquer usuário. SELECT de admin já existe ("Admins can view all notifications").
--   * campaigns: SELECT de admin já existe ("Admins can view all campaigns").
--   * Estatísticas agregadas no servidor (as listas agora são paginadas, então o total não pode
--     vir das linhas carregadas): admin_business_settings_stats() e admin_campaign_stats().
-- integrations NÃO ganha policy nova (tokens); o admin continua usando get_integrations_admin_safe().
-- =============================================

-- business_settings
drop policy if exists business_settings_admin_select on public.business_settings;
create policy business_settings_admin_select on public.business_settings
  for select to authenticated
  using (public.is_admin_or_super_admin());

-- notifications
drop policy if exists notifications_admin_insert on public.notifications;
create policy notifications_admin_insert on public.notifications
  for insert to authenticated
  with check (public.is_admin_or_super_admin());

drop policy if exists notifications_admin_update on public.notifications;
create policy notifications_admin_update on public.notifications
  for update to authenticated
  using (public.is_admin_or_super_admin())
  with check (public.is_admin_or_super_admin());

drop policy if exists notifications_admin_delete on public.notifications;
create policy notifications_admin_delete on public.notifications
  for delete to authenticated
  using (public.is_admin_or_super_admin());

-- Estatísticas de negócios
create or replace function public.admin_business_settings_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total', (select count(*) from public.business_settings),
    'recent_7d', (select count(*) from public.business_settings
                   where created_at > now() - interval '7 days'),
    -- category guarda o id de sector_categories (texto); o nome vai junto para a UI
    'categories', coalesce(
      (select jsonb_agg(jsonb_build_object('id', x.category, 'name', coalesce(sc.name, x.category), 'count', x.n)
                        order by x.n desc, coalesce(sc.name, x.category))
       from (
         select category, count(*) as n
         from public.business_settings
         where nullif(btrim(category), '') is not null
         group by category) x
       left join public.sector_categories sc on sc.id::text = x.category), '[]'::jsonb)
  ) into v_result;

  return v_result;
end $$;
revoke all on function public.admin_business_settings_stats() from public, anon;
grant execute on function public.admin_business_settings_stats() to authenticated, service_role;

-- Estatísticas de campanhas (status normalizado em minúsculas)
create or replace function public.admin_campaign_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select jsonb_build_object(
    'total', count(*),
    'by_status', coalesce(
      (select jsonb_object_agg(st, n) from (
         select lower(coalesce(status, 'desconhecido')) as st, count(*) as n
         from public.campaigns group by 1) x), '{}'::jsonb),
    'total_budget', coalesce(sum(coalesce(budget_total, 0)), 0),
    'avg_budget', case when count(*) > 0 then round(sum(coalesce(budget_total, 0)) / count(*), 2) else 0 end,
    'integrated', count(*) filter (where meta_campaign_id is not null)
  ) into v_result
  from public.campaigns;

  return v_result;
end $$;
revoke all on function public.admin_campaign_stats() from public, anon;
grant execute on function public.admin_campaign_stats() to authenticated, service_role;
