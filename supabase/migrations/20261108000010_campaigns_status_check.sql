-- =============================================
-- Audit DATA-05 (2026-11-08): CHECK de campaigns.status = vocabulário canônico (CMP-10)
-- Fonte: supabase/functions/_shared/status.ts
--   draft | pending_review | active | paused | finished | error | deleted
-- A CHECK original (20241228: draft/active/paused/completed) já não existe em produção.
-- Produção em 2026-11-08: paused 311, finished 76, active 7 (tudo minúsculo).
-- Writers revisados: meta-oauth-exchange passou a usar mapMetaEffectiveStatus (antes gravava
-- effective_status.toLowerCase(), p.ex. 'in_process', 'with_issues', 'campaign_paused').
-- Aplicar DEPOIS do deploy de meta-oauth-exchange.
--
-- campaign_contingency.status: mantém a CHECK (pending/in_progress/completed/failed);
-- nenhum writer grava mais 'auto_retry_*' (auto-retry removido na fase 4).
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

-- 1. normaliza valores legados (no-op em produção hoje; protege replay/staging)
update public.campaigns
   set status = case lower(btrim(status))
                  when 'in_review'       then 'pending_review'
                  when 'in_process'      then 'pending_review'
                  when 'preapproved'     then 'pending_review'
                  when 'rejected'        then 'error'
                  when 'disapproved'     then 'error'
                  when 'with_issues'     then 'error'
                  when 'pending_billing_info' then 'error'
                  when 'campaign_paused' then 'paused'
                  when 'adset_paused'    then 'paused'
                  when 'archived'        then 'finished'
                  when 'completed'       then 'finished'
                  else lower(btrim(status))
                end
 where status is distinct from lower(btrim(status))
    or lower(btrim(status)) not in ('draft','pending_review','active','paused','finished','error','deleted');

-- qualquer resto desconhecido vira 'paused' (estado seguro; o próximo sync corrige)
update public.campaigns
   set status = 'paused'
 where status is not null
   and status not in ('draft','pending_review','active','paused','finished','error','deleted');

-- 2. CHECK
alter table public.campaigns drop constraint if exists campaigns_status_check;
alter table public.campaigns
  add constraint campaigns_status_check
  check (status in ('draft','pending_review','active','paused','finished','error','deleted'));
