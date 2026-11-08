-- =============================================
-- Audit ADM-01 (2026-11-08): números reais no painel admin.
-- Antes: receita = campanhas × 50, "assinaturas ativas" = perfis não suspensos, topPlan fixo 'basic'.
-- admin_dashboard_stats() calcula, só para admins:
--   * assinantes ativos por provedor (subscribers ativos + pagarme_subscriptions 'active' em live;
--     um usuário conta uma vez por provedor)
--   * MRR a partir do preço do plano (anual ÷ 12): Pagar.me → amount_cents da assinatura;
--     Asaas → asaas_plans via asaas_pending_checkouts; fallback subscription_plans.price_monthly
--   * churn = cancelamentos nos últimos 30 dias ÷ (ativos + cancelados no período)
--   * campanhas via count(*)
-- =============================================
create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql stable security definer set search_path = public as $$
declare
  v_result jsonb;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  with sub_active as (
    -- subscribers: Asaas / Stripe / registros manuais. Pagar.me vem da própria tabela abaixo.
    select distinct on (coalesce(nullif(s.provider, ''), 'stripe'), s.user_id)
      coalesce(nullif(s.provider, ''), 'stripe') as provider,
      s.user_id,
      coalesce(nullif(s.plan_type, ''), nullif(s.subscription_tier, ''), 'desconhecido') as plan_label,
      coalesce(
        case when ap.amount is not null then
          case when upper(coalesce(ap.cycle, '')) in ('YEARLY', 'ANNUAL', 'ANUAL') then ap.amount / 12
               when upper(coalesce(ap.cycle, '')) = 'SEMIANNUALLY' then ap.amount / 6
               when upper(coalesce(ap.cycle, '')) = 'QUARTERLY' then ap.amount / 3
               else ap.amount end
        end,
        sp.price_monthly,
        0
      )::numeric as mrr
    from public.subscribers s
    left join lateral (
      select c.plan_id
      from public.asaas_pending_checkouts c
      where s.asaas_subscription_id is not null
        and c.asaas_subscription_id = s.asaas_subscription_id
      order by c.updated_at desc nulls last
      limit 1
    ) chk on true
    left join public.asaas_plans ap on ap.id = chk.plan_id
    left join lateral (
      select p.price_monthly
      from public.subscription_plans p
      where p.plan_type = s.plan_type
      order by p.is_active desc, p.updated_at desc nulls last
      limit 1
    ) sp on true
    where s.user_id is not null
      and coalesce(s.provider, '') <> 'pagarme'
      and coalesce(s.is_active, false)
      and lower(coalesce(s.subscription_status, 'active')) in ('active', 'trialing')
    order by coalesce(nullif(s.provider, ''), 'stripe'), s.user_id, s.updated_at desc nulls last
  ),
  pagarme_active as (
    select distinct on (ps.user_id)
      'pagarme'::text as provider,
      ps.user_id,
      coalesce(nullif(ps.plan_code, ''), 'desconhecido') as plan_label,
      (case when lower(coalesce(ps.plan_code, '')) ~ '(anual|annual|year|yearly)'
            then coalesce(ps.amount_cents, 0) / 100.0 / 12
            else coalesce(ps.amount_cents, 0) / 100.0 end)::numeric as mrr
    from public.pagarme_subscriptions ps
    where ps.user_id is not null
      and lower(ps.status) = 'active'
      and coalesce(ps.environment, 'live') = 'live'
    order by ps.user_id, ps.updated_at desc nulls last
  ),
  active_all as (
    select * from sub_active
    union all
    select * from pagarme_active
  ),
  canceled_30d as (
    select s.user_id
    from public.subscribers s
    where s.user_id is not null
      and (
        s.canceled_at >= now() - interval '30 days'
        or (lower(coalesce(s.subscription_status, '')) in ('canceled', 'cancelled')
            and s.canceled_at is null
            and s.updated_at >= now() - interval '30 days')
      )
    union
    select l.user_id
    from public.subscription_status_log l
    where l.user_id is not null
      and lower(coalesce(l.new_status, '')) in ('canceled', 'cancelled')
      and l.created_at >= now() - interval '30 days'
    union
    select ps.user_id
    from public.pagarme_subscriptions ps
    where ps.user_id is not null
      and lower(ps.status) in ('canceled', 'cancelled')
      and coalesce(ps.environment, 'live') = 'live'
      and ps.updated_at >= now() - interval '30 days'
  ),
  totals as (
    select
      (select count(*) from active_all) as active_subscriptions,
      (select count(distinct user_id) from active_all) as active_subscribers,
      (select coalesce(round(sum(mrr), 2), 0) from active_all) as mrr,
      (select count(*) from canceled_30d) as canceled_last_30_days,
      (select count(*) from public.profiles) as total_users,
      (select count(*) from public.profiles where status = 'suspended') as suspended_users,
      (select count(*) from public.profiles
         where created_at >= date_trunc('month', now())) as new_users_this_month
  )
  select jsonb_build_object(
    'total_users', t.total_users,
    'suspended_users', t.suspended_users,
    'new_users_this_month', t.new_users_this_month,
    'active_subscriptions', t.active_subscriptions,
    'active_subscribers', t.active_subscribers,
    'active_by_provider', coalesce(
      (select jsonb_object_agg(provider, n) from (
         select provider, count(*) as n from active_all group by provider) x), '{}'::jsonb),
    'mrr', t.mrr,
    'mrr_by_provider', coalesce(
      (select jsonb_object_agg(provider, v) from (
         select provider, round(sum(mrr), 2) as v from active_all group by provider) x), '{}'::jsonb),
    'arpu', case when t.active_subscriptions > 0 then round(t.mrr / t.active_subscriptions, 2) else 0 end,
    'canceled_last_30_days', t.canceled_last_30_days,
    'churn_rate_30d', case when (t.active_subscriptions + t.canceled_last_30_days) > 0
      then round(t.canceled_last_30_days::numeric * 100 / (t.active_subscriptions + t.canceled_last_30_days), 2)
      else 0 end,
    'conversion_rate', case when t.total_users > 0
      then round(t.active_subscribers::numeric * 100 / t.total_users, 2) else 0 end,
    'top_plan', (select plan_label from active_all group by plan_label
                 order by count(*) desc, plan_label limit 1),
    'campaigns_total', (select count(*) from public.campaigns),
    'campaigns_by_status', coalesce(
      (select jsonb_object_agg(st, n) from (
         select lower(coalesce(status, 'desconhecido')) as st, count(*) as n
         from public.campaigns group by 1) x), '{}'::jsonb),
    'generated_at', now()
  )
  into v_result
  from totals t;

  return v_result;
end $$;
revoke all on function public.admin_dashboard_stats() from public, anon;
grant execute on function public.admin_dashboard_stats() to authenticated, service_role;
