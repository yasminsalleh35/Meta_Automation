-- =============================================
-- Audit SEC-11 (2026-11-02): agendamento das functions de cron
-- Pré-requisitos (fora do repositório, uma vez por projeto):
--   1. Function secret:  supabase secrets set CRON_SECRET=<valor aleatório longo>
--   2. Vault (SQL editor):
--        select vault.create_secret('<mesmo valor>', 'cron_secret');
--        select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
-- meta-campaign-auto-sync: produção já tinha 'meta-campaign-auto-sync-job' (*/10) chamando com a
-- anon key, que a nova guarda rejeita. Mantemos o mesmo agendamento, agora via x-cron-secret.
-- =============================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.invoke_cron_function(p_function text, p_body jsonb default '{}'::jsonb)
returns bigint
language plpgsql security definer set search_path = public, extensions as $$
declare v_url text; v_secret text; v_id bigint;
begin
  select decrypted_secret into v_url    from vault.decrypted_secrets where name = 'project_url' limit 1;
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret' limit 1;
  if v_url is null or v_secret is null then
    raise exception 'vault secrets project_url/cron_secret not configured';
  end if;
  select net.http_post(
    url := v_url || '/functions/v1/' || p_function,
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body := p_body,
    timeout_milliseconds := 60000
  ) into v_id;
  return v_id;
end $$;
revoke all on function public.invoke_cron_function(text, jsonb) from public, anon, authenticated;

-- (re)cria os jobs de forma idempotente
do $$
declare j text;
begin
  foreach j in array array['camply_subscription_sync_all','camply_subscription_expire_grace',
                           'camply_metrics_refresh_all','camply_metrics_check_alerts','camply_auto_verify_ad_sets',
                           'camply_meta_campaign_auto_sync','meta-campaign-auto-sync-job']
  loop
    if exists (select 1 from cron.job where jobname = j) then
      perform cron.unschedule(j);
    end if;
  end loop;
end $$;

select cron.schedule('camply_subscription_sync_all',     '0 */6 * * *',
  $$ select public.invoke_cron_function('subscription-sync', '{"mode":"sync_all"}'::jsonb) $$);
select cron.schedule('camply_subscription_expire_grace', '30 */6 * * *',
  $$ select public.invoke_cron_function('subscription-sync', '{"mode":"expire_grace"}'::jsonb) $$);
select cron.schedule('camply_metrics_refresh_all',       '*/15 * * * *',
  $$ select public.invoke_cron_function('metrics-cache-refresh', '{"mode":"refresh_all"}'::jsonb) $$);
select cron.schedule('camply_metrics_check_alerts',      '5 * * * *',
  $$ select public.invoke_cron_function('metrics-cache-refresh', '{"mode":"check_alerts"}'::jsonb) $$);
select cron.schedule('camply_auto_verify_ad_sets',       '10 * * * *',
  $$ select public.invoke_cron_function('auto-verify-ad-sets', '{}'::jsonb) $$);
select cron.schedule('camply_meta_campaign_auto_sync',   '*/10 * * * *',
  $$ select public.invoke_cron_function('meta-campaign-auto-sync', '{"triggered_by":"cron"}'::jsonb) $$);
