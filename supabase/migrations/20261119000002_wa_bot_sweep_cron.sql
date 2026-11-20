-- WhatsApp bot safety net (docs/whatsapp-campaign-bot-plan.md §5.4): every minute the worker re-kicks
-- unprocessed messages/jobs, reports stuck jobs honestly and applies retention. While WA_BOT_MODE=off
-- (or the bot isn't configured) the worker returns {"skipped":true} immediately.
do $$
begin
  if exists (select 1 from cron.job where jobname = 'camply_wa_bot_sweep') then
    perform cron.unschedule('camply_wa_bot_sweep');
  end if;
end $$;

select cron.schedule(
  'camply_wa_bot_sweep',
  '* * * * *',
  $$ select public.invoke_cron_function('wa-bot-worker', '{"mode":"sweep"}'::jsonb) $$
);
