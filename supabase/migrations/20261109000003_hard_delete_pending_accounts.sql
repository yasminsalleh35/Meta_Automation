-- =============================================
-- Audit LGL-03 (2026-11-09): hard delete das contas com exclusão pedida há mais de 30 dias
-- Perfis com status 'pending_deletion' e deletion_requested_at < now() - 30 dias têm o
-- auth.users apagado (o resto cai em cascata). Agenda diária 04:00 UTC (camply_hard_delete_accounts).
--
-- FKs para auth.users / profiles (levantadas em produção em 2026-11-09):
--   CASCADE  (somem junto): profiles, business_settings*, campaign_create_requests,
--            campaign_metrics_cache, account_insights_cache, campaign_sync_queue, code_snapshots,
--            media_files, meta_api_usage, notifications, oauth_states, optimization_logs,
--            optimization_suggestions, performance_alerts, strategy_reports, subscribers,
--            subscription_status_log, support_tickets (+ ticket_responses), usage_tracking,
--            user_entitlements, user_roles, whatsapp_numbers, campaign_contingency (via profiles),
--            learning_content_comments (via profiles).
--   SET NULL (linha fica, sem vínculo): edge_function_logs, leads.user_id, quizzes.created_by,
--            campaign_profiles.owner_user_id, pagarme_customers, pagarme_subscriptions.
--   NO ACTION (bloqueariam o delete) — tratados aqui antes:
--            integrations, integration_access_log, whatsapp_campaigns, expected_ad_set_settings
--              → apagados (dados pessoais/operacionais do titular, sem obrigação de guarda);
--            campaign_profiles.created_by, campaign_contingency.completed_by,
--            support_tickets.assigned_to, stripe_config_audit.user_id
--              → set null (são ações de admins sobre registros de terceiros).
--            business_settings → campaign_profiles (NO ACTION): business_settings é apagado antes
--              dos campaign_profiles auto-gerados do titular.
--   SEM FK (ficariam órfãs) — apagadas aqui: campaigns (+ campaign_jobs em cascata),
--            ai_usage_events, meta_whatsapp_numbers, rate_limits, user_learning_progress;
--            leads.owner_id → set null.
--   MANTIDAS de propósito (registros fiscais/auditoria, art. 16 I LGPD): payments (sem FK; o
--            user_id fica como identificador opaco), pagarme_customers/pagarme_subscriptions
--            (user_id vira null pela FK), security_audit_log e pagarme_config_audit (sem FK).
-- Fora do escopo: arquivos no Storage (bucket user-media) — storage.objects tem o trigger
--   protect_objects_delete, então precisam ser removidos pela Storage API (pendência).
-- Cada conta roda num sub-bloco: uma falha vira WARNING e não impede as demais.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

create or replace function public.hard_delete_pending_accounts()
returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  r record;
  v_deleted int := 0;
begin
  for r in
    select p.id
      from public.profiles p
     where p.status = 'pending_deletion'
       and p.deletion_requested_at is not null
       and p.deletion_requested_at < now() - interval '30 days'
  loop
    begin
      -- tabelas sem FK (senão ficariam órfãs)
      delete from public.campaigns              where user_id = r.id;
      delete from public.ai_usage_events        where user_id = r.id;
      delete from public.meta_whatsapp_numbers  where user_id = r.id;
      delete from public.rate_limits            where user_id = r.id;
      delete from public.user_learning_progress where user_id = r.id;
      update public.leads set owner_id = null   where owner_id = r.id;

      -- FKs NO ACTION que bloqueariam o delete de auth.users
      delete from public.integration_access_log
       where user_id = r.id
          or integration_id in (select i.id from public.integrations i where i.user_id = r.id);
      delete from public.integrations             where user_id = r.id;
      delete from public.whatsapp_campaigns       where user_id = r.id;
      delete from public.expected_ad_set_settings where user_id = r.id;
      delete from public.business_settings        where user_id = r.id;
      delete from public.campaign_profiles cp
       where cp.owner_user_id = r.id
         and cp.is_auto_generated
         and not exists (select 1 from public.business_settings b where b.campaign_profile_id = cp.id);
      update public.campaign_profiles    set created_by   = null where created_by   = r.id;
      update public.campaign_contingency set completed_by = null where completed_by = r.id;
      update public.support_tickets      set assigned_to  = null where assigned_to  = r.id;
      update public.stripe_config_audit  set user_id      = null where user_id      = r.id;

      -- o resto cai em cascata (profiles inclusive)
      delete from auth.users where id = r.id;
      v_deleted := v_deleted + 1;
    exception when others then
      raise warning 'audit LGL-03: hard delete failed for %: % (%)', r.id, sqlerrm, sqlstate;
    end;
  end loop;

  return v_deleted;
end;
$function$;

revoke all on function public.hard_delete_pending_accounts() from public, anon, authenticated;
grant execute on function public.hard_delete_pending_accounts() to service_role;

-- agenda diária 04:00 UTC (idempotente; padrão de 20261102000005_cron_jobs.sql)
do $$
declare v_id bigint;
begin
  begin
    select jobid into v_id from cron.job where jobname = 'camply_hard_delete_accounts';
    if v_id is not null then
      perform cron.unschedule(v_id);
    end if;
  exception when others then
    raise notice 'could not unschedule camply_hard_delete_accounts (%)', sqlerrm;
  end;

  perform cron.schedule('camply_hard_delete_accounts', '0 4 * * *',
                        'select public.hard_delete_pending_accounts()');
end $$;
