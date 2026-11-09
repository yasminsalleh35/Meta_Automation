-- =============================================
-- Audit ADM-03 (2026-11-08): lista de assinaturas do admin paginada no servidor e com todos os provedores.
-- Antes: AdminSubscriptions listava perfis pelo subscribers.plan_type (carregando todos os usuários,
-- limitado a 1.000 linhas) e omitia os assinantes Pagar.me (tabela pagarme_subscriptions), embora
-- admin_dashboard_stats() os contasse.
-- admin_list_subscriptions() devolve, só para admins, uma linha por assinatura:
--   * subscribers (Stripe / Asaas / registros manuais; provider vazio = 'stripe'), exceto provider 'pagarme'
--   * pagarme_subscriptions (environment 'live' por padrão; p_include_test = true inclui 'test')
-- "ativa" (is_current) segue a mesma regra do dashboard; MRR idem (anual ÷ 12 etc.).
-- total_count = total de linhas que casam com os filtros (count(*) over ()).
-- Somente leitura: não altera tabelas de pagamento.
-- =============================================
drop function if exists public.admin_list_subscriptions(text, text, text, integer, integer, boolean);

create function public.admin_list_subscriptions(
  p_search text default null,
  p_provider text default null,
  p_status text default null,
  p_limit integer default 50,
  p_offset integer default 0,
  p_include_test boolean default false
)
returns table (
  source text,
  id uuid,
  provider text,
  user_id uuid,
  email text,
  name text,
  plan_label text,
  status text,
  is_current boolean,
  monthly_amount numeric,
  current_period_end timestamptz,
  canceled_at timestamptz,
  external_id text,
  environment text,
  created_at timestamptz,
  updated_at timestamptz,
  total_count bigint
)
language plpgsql stable security definer set search_path = public as $$
#variable_conflict use_column
declare
  v_search text := nullif(btrim(coalesce(p_search, '')), '');
  v_provider text := nullif(lower(btrim(coalesce(p_provider, ''))), 'all');
  v_status text := nullif(lower(btrim(coalesce(p_status, ''))), 'all');
  v_limit integer := least(greatest(coalesce(p_limit, 50), 1), 1000);
  v_offset integer := greatest(coalesce(p_offset, 0), 0);
  v_pattern text;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_provider = '' then v_provider := null; end if;
  if v_status = '' then v_status := null; end if;
  if v_search is not null then
    -- escapa curingas do ILIKE: o termo é sempre literal
    v_pattern := '%' || replace(replace(replace(left(v_search, 100), '\', '\\'), '%', '\%'), '_', '\_') || '%';
  end if;

  return query
  with unified as (
    select
      'subscribers'::text as source,
      s.id,
      coalesce(nullif(lower(s.provider), ''), 'stripe') as provider,
      s.user_id,
      coalesce(p.email, s.email) as email,
      p.name,
      coalesce(nullif(s.plan_type, ''), nullif(s.subscription_tier, ''), 'desconhecido') as plan_label,
      lower(coalesce(nullif(s.subscription_status, ''),
                     case when coalesce(s.is_active, false) then 'active' else 'inactive' end)) as status,
      (coalesce(s.is_active, false)
        and lower(coalesce(s.subscription_status, 'active')) in ('active', 'trialing')) as is_current,
      coalesce(
        case when ap.amount is not null then
          case when upper(coalesce(ap.cycle, '')) in ('YEARLY', 'ANNUAL', 'ANUAL') then ap.amount / 12
               when upper(coalesce(ap.cycle, '')) = 'SEMIANNUALLY' then ap.amount / 6
               when upper(coalesce(ap.cycle, '')) = 'QUARTERLY' then ap.amount / 3
               else ap.amount end
        end,
        sp.price_monthly,
        0
      )::numeric as monthly_amount,
      coalesce(s.current_period_end, s.subscription_end, s.plan_expires_at) as current_period_end,
      s.canceled_at,
      coalesce(s.asaas_subscription_id, s.stripe_subscription_id) as external_id,
      'live'::text as environment,
      s.created_at,
      s.updated_at
    from public.subscribers s
    left join public.profiles p on p.id = s.user_id
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
      select sp0.price_monthly
      from public.subscription_plans sp0
      where sp0.plan_type = s.plan_type
      order by sp0.is_active desc, sp0.updated_at desc nulls last
      limit 1
    ) sp on true
    where coalesce(lower(s.provider), '') <> 'pagarme'

    union all

    select
      'pagarme_subscriptions'::text,
      ps.id,
      'pagarme'::text,
      ps.user_id,
      coalesce(p.email, ps.email),
      p.name,
      coalesce(nullif(ps.plan_code, ''), 'desconhecido'),
      lower(coalesce(nullif(ps.status, ''), 'desconhecido')),
      lower(coalesce(ps.status, '')) = 'active',
      (case when lower(coalesce(ps.plan_code, '')) ~ '(anual|annual|year|yearly)'
            then coalesce(ps.amount_cents, 0) / 100.0 / 12
            else coalesce(ps.amount_cents, 0) / 100.0 end)::numeric,
      ps.current_period_end,
      null::timestamptz,
      ps.pagarme_subscription_id,
      coalesce(ps.environment, 'live'),
      ps.created_at,
      ps.updated_at
    from public.pagarme_subscriptions ps
    left join public.profiles p on p.id = ps.user_id
    where p_include_test or coalesce(ps.environment, 'live') = 'live'
  ),
  filtered as (
    select u.*
    from unified u
    where (v_provider is null or u.provider = v_provider)
      and (v_status is null
           or (v_status = 'current' and u.is_current)
           or (v_status = 'not_current' and not u.is_current)
           or (v_status in ('canceled', 'cancelled') and u.status in ('canceled', 'cancelled'))
           or (v_status not in ('current', 'not_current', 'canceled', 'cancelled') and u.status = v_status))
      and (v_pattern is null
           or u.email ilike v_pattern
           or u.name ilike v_pattern
           or u.plan_label ilike v_pattern
           or u.external_id ilike v_pattern)
  )
  select
    f.source, f.id, f.provider, f.user_id, f.email, f.name, f.plan_label, f.status, f.is_current,
    round(f.monthly_amount, 2), f.current_period_end, f.canceled_at, f.external_id, f.environment,
    f.created_at, f.updated_at,
    count(*) over () as total_count
  from filtered f
  order by f.is_current desc, f.updated_at desc nulls last, f.id
  limit v_limit offset v_offset;
end $$;

revoke all on function public.admin_list_subscriptions(text, text, text, integer, integer, boolean) from public, anon;
grant execute on function public.admin_list_subscriptions(text, text, text, integer, integer, boolean) to authenticated, service_role;
