-- =============================================
-- Audit LGL-03 (2026-11-09): o cron diário de exclusão definitiva passa a chamar a
-- edge function purge-deleted-accounts, que apaga os arquivos do Storage
-- (user-media, whatsapp-campaign-media) de cada conta antes de rodar
-- hard_delete_pending_accounts(). O SQL sozinho não pode apagar storage.objects.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

do $$
declare
  v_jobid bigint;
begin
  select jobid into v_jobid from cron.job where jobname = 'camply_hard_delete_accounts';
  if v_jobid is not null then
    begin
      perform cron.unschedule(v_jobid);
    exception when others then
      raise notice 'could not unschedule camply_hard_delete_accounts (%): %', v_jobid, sqlerrm;
    end;
  end if;
end $$;

select cron.schedule(
  'camply_hard_delete_accounts',
  '0 4 * * *',
  $$select public.invoke_cron_function('purge-deleted-accounts', '{}'::jsonb)$$
);
