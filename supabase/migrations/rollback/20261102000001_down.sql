-- Rollback de 20261102000001_security_containment.sql — NÃO aplicar automaticamente.
-- Use somente se a criação de campanhas em produção quebrar após o SEC-02.
-- Reabre o EXECUTE das RPCs para authenticated (NÃO para anon — a exposição anônima não deve voltar).
begin;
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
    execute format('grant execute on function %s to authenticated', r.sig);
  end loop;
end $$;

-- Storage: restaura leitura ampla do bucket (somente se uploads/thumbnails quebrarem)
-- drop policy if exists "user_media_select_own" on storage.objects;
-- create policy "Users can view media in user-media bucket" on storage.objects for select
--   using (bucket_id = 'user-media');

-- As políticas removidas não são recriadas aqui: eram abertas (USING/WITH CHECK true).
-- Se alguma for realmente necessária, recrie-a com escopo (auth.uid() = user_id).
commit;
