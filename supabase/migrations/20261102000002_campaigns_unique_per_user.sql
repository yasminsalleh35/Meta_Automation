-- =============================================
-- Audit DATA-03 / SEC-15 (2026-11-02): unicidade de campanha por usuário
-- UNIQUE(meta_campaign_id) global fazia o upsert de um usuário sobrescrever a linha de outro
-- (conta de anúncio compartilhada). Índice parcial não serve para onConflict do PostgREST.
-- Deploy ANTES das functions que usam onConflict 'user_id,meta_campaign_id'
-- (meta-campaigns-discover, meta-oauth-exchange).
-- =============================================
begin;

do $$
declare dup_count int;
begin
  select count(*) into dup_count from (
    select user_id, meta_campaign_id from public.campaigns
    where meta_campaign_id is not null
    group by 1, 2 having count(*) > 1
  ) d;
  if dup_count > 0 then
    raise exception 'Existem % pares (user_id, meta_campaign_id) duplicados em campaigns. Deduplique antes.', dup_count;
  end if;
end $$;

alter table public.campaigns drop constraint if exists campaigns_meta_campaign_id_unique;   -- 20251018155059
drop index if exists public.uq_campaigns_user_meta_campaign;                               -- parcial, 20260221130730

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'campaigns_user_meta_campaign_unique') then
    alter table public.campaigns
      add constraint campaigns_user_meta_campaign_unique unique (user_id, meta_campaign_id);  -- NULLs continuam distintos
  end if;
end $$;

commit;
