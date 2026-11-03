-- =============================================
-- Audit SEC-02 (2026-11-02): contenção de segredos e políticas abertas
-- Idempotente. Edge functions usam service_role (ignora RLS) e continuam funcionando.
-- Deploy JUNTO com o frontend do SEC-04 (useGlobalMetaConfig / useMetaAdsAdmin).
-- Rollback: supabase/migrations/rollback/20261102000001_down.sql
-- =============================================
begin;

-- 1. RPCs que devolvem segredos / IDOR / CRUD sem checagem de papel: somente service_role (todas as overloads)
--    get_pagarme_config_public NÃO entra: devolve só public_key + flags e é usado pelo checkout.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (p.proname in (
            'get_stripe_config_for_functions','get_pagarme_config_for_functions',
            'get_asaas_config_for_functions','get_active_pagarme_config',
            'get_meta_ads_config','upsert_meta_ads_config',
            'get_global_setting','get_user_subscription_with_plan',
            'check_user_limit','increment_usage','anonymize_old_leads')
           or p.proname ~ '^(create|update|delete)_sector_')
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
    execute format('grant execute on function %s to service_role', r.sig);
  end loop;
end $$;

-- 2. Substitutos seguros para o navegador
create or replace function public.get_meta_app_public_config()
returns table(app_id text, business_manager_id text)
language sql stable security definer set search_path = public as $$
  select c.app_id, c.business_manager_id from public.meta_ads_config c order by c.updated_at desc nulls last limit 1;
$$;
revoke all on function public.get_meta_app_public_config() from public, anon;
grant execute on function public.get_meta_app_public_config() to authenticated, service_role;

create or replace function public.admin_get_meta_ads_config()
returns table(id uuid, app_id text, app_secret_set boolean, business_manager_id text, created_at timestamptz, updated_at timestamptz)
language plpgsql stable security definer set search_path = public as $$
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
    select c.id, c.app_id, (c.app_secret is not null and c.app_secret <> ''),
           c.business_manager_id, c.created_at, c.updated_at
    from public.meta_ads_config c order by c.updated_at desc nulls last limit 1;
end $$;
revoke all on function public.admin_get_meta_ads_config() from public, anon;
grant execute on function public.admin_get_meta_ads_config() to authenticated, service_role;

-- p_app_secret vazio/null = manter o segredo atual
create or replace function public.admin_upsert_meta_ads_config(
  p_app_id text, p_app_secret text default null, p_business_manager_id text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  if not public.is_admin_or_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if coalesce(trim(p_app_id), '') = '' then
    raise exception 'app_id is required' using errcode = '22023';
  end if;
  select c.id into v_id from public.meta_ads_config c order by c.updated_at desc nulls last limit 1;
  if v_id is null then
    if coalesce(trim(p_app_secret), '') = '' then
      raise exception 'app_secret is required on first save' using errcode = '22023';
    end if;
    insert into public.meta_ads_config (app_id, app_secret, business_manager_id)
    values (trim(p_app_id), trim(p_app_secret), nullif(trim(p_business_manager_id), ''))
    returning id into v_id;
  else
    update public.meta_ads_config
       set app_id = trim(p_app_id),
           app_secret = coalesce(nullif(trim(p_app_secret), ''), app_secret),
           business_manager_id = nullif(trim(p_business_manager_id), ''),
           updated_at = now()
     where id = v_id;
  end if;
  return v_id;
end $$;
revoke all on function public.admin_upsert_meta_ads_config(text, text, text) from public, anon;
grant execute on function public.admin_upsert_meta_ads_config(text, text, text) to authenticated, service_role;

-- 3. Políticas que expõem segredos ou permitem escrita indevida
-- (tabela, política). Tolerante a tabelas ausentes no banco ao vivo.
do $$
declare p text[];
begin
  foreach p slice 1 in array array[
    ['pagarme_settings',         'pagarme_public_settings_v_select_public'],   -- SELECT true, inclui secret_key
    ['subscribers',              'update_own_subscription'],                   -- usuário se auto-ativava
    ['subscribers',              'insert_subscription'],
    ['campaign_sync_queue',      'System can update sync queue'],
    ['campaign_sync_queue',      'System can delete from sync queue'],
    ['campaign_profiles',        'cp_select_all'],                             -- expunha perfis auto-gerados de outros usuários
    ['optimization_suggestions', 'Service role can insert suggestions'],
    ['campaign_contingency',     'System can insert contingencies'],
    ['pagarme_config_audit',     'system_insert_pagarme_config_audit'],
    ['rate_limits',              'Users can manage their own rate limits'],    -- incluía auth.uid() IS NULL
    ['lead_rate_limit',          'rate_limit_edge_function_access'],
    ['pagarme_event_log',        'system_manage_pagarme_event_log'],           -- FOR ALL true
    ['payment_audit_log',        'system_insert_payment_audit_log'],
    ['payments',                 'system_insert_payments'],
    ['security_audit_log',       'system_insert_audit_log'],
    ['optimization_logs',        'Service role can insert logs'],
    ['subscription_status_log',  'Service role can insert subscription logs'],
    ['quiz_leads',               'Anyone can submit quiz leads']               -- envio passa por lead-quiz-submit (service role)
  ]
  loop
    if to_regclass('public.' || quote_ident(p[1])) is not null then
      execute format('drop policy if exists %I on public.%I', p[2], p[1]);
    else
      raise notice 'tabela public.% não existe — pulando %', p[1], p[2];
    end if;
  end loop;
end $$;
-- Mantidas de propósito: "Users can update own suggestions" (auth.uid() = user_id), "Secure lead creation" (landing pages).

-- campaign_profiles: após remover cp_select_all, valem "Users can view their own auto-generated profiles"
-- (owner_user_id = auth.uid() OR owner_user_id IS NULL) e cp_admin_write. Nada a criar.

-- 4. Storage: cada usuário lê apenas a própria pasta em user-media (paths = <user_id>/<arquivo>)
drop policy if exists "Users can view media in user-media bucket" on storage.objects;
drop policy if exists "user_media_select_own" on storage.objects;
create policy "user_media_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'user-media' and (storage.foldername(name))[1] = auth.uid()::text);
-- ATENÇÃO: se o bucket for public=true, URLs públicas continuam acessíveis (ver Appendix C #5 / CMP-16).

commit;
