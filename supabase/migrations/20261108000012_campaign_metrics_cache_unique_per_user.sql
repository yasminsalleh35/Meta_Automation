-- =============================================
-- Audit DATA-05 (2026-11-08): chave do cache de métricas por usuário
-- campaign_metrics_cache.campaign_id é o ID da campanha na Meta (text), não o uuid interno.
-- Com UNIQUE(campaign_id, date_preset) global, dois usuários com a mesma campanha da Meta
-- (conta de anúncios compartilhada) sobrescreviam o cache um do outro.
-- Nova chave: UNIQUE(user_id, campaign_id, date_preset).
-- metrics-cache-refresh usa onConflict 'user_id,campaign_id,date_preset': aplicar esta
-- migração e redeployar a function em seguida (entre os dois passos o upsert do cache falha
-- com 42P10 e o cache só deixa de ser atualizado; nada é perdido).
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.campaign_metrics_cache'::regclass
                   and conname = 'campaign_metrics_cache_user_campaign_preset_key') then
    alter table public.campaign_metrics_cache
      add constraint campaign_metrics_cache_user_campaign_preset_key
      unique (user_id, campaign_id, date_preset);
  end if;
end $$;

alter table public.campaign_metrics_cache
  drop constraint if exists campaign_metrics_cache_campaign_id_date_preset_key;
