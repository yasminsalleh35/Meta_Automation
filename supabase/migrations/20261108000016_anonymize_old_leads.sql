-- =============================================
-- Audit DATA-07 (2026-11-08): anonymize_old_leads completo + agendamento mensal
-- A versão anterior só limpava name/email/whatsapp/notes de public.leads, deixava
-- answers, instagram, clinic_name, city (e website/comments) e nunca era agendada.
-- Também pulava leads já 'archived' manualmente (que então nunca eram anonimizados):
-- o critério agora é o marcador name = 'ANONYMIZED'.
-- quiz_leads (mesmo formulário público, mesmos dados pessoais) entra na mesma política.
-- Retenção: 2 anos. Agenda: dia 1 de cada mês, 03:00 UTC.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

create or replace function public.anonymize_old_leads()
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
begin
  update public.leads
     set name          = 'ANONYMIZED',
         email         = null,
         whatsapp_e164 = null,
         instagram     = null,
         clinic_name   = null,
         city          = null,
         website       = null,
         answers       = '{}'::jsonb,
         comments      = '[]'::jsonb,
         notes         = 'Data anonymized due to retention policy',
         status        = 'archived'
   where created_at < now() - interval '2 years'
     and name is distinct from 'ANONYMIZED';

  update public.quiz_leads
     set lead_name    = 'ANONYMIZED',
         email        = null,
         whatsapp     = null,
         company_name = null,
         responses    = '{}'::jsonb,
         ai_insights  = '{}'::jsonb
   where created_at < now() - interval '2 years'
     and lead_name is distinct from 'ANONYMIZED';
end;
$function$;

revoke all on function public.anonymize_old_leads() from public, anon, authenticated;
grant execute on function public.anonymize_old_leads() to service_role;

-- agenda mensal (idempotente; padrão de 20261102000005_cron_jobs.sql)
do $$
declare v_id bigint;
begin
  begin
    select jobid into v_id from cron.job where jobname = 'camply_anonymize_old_leads';
    if v_id is not null then
      perform cron.unschedule(v_id);
    end if;
  exception when others then
    raise notice 'could not unschedule camply_anonymize_old_leads (%)', sqlerrm;
  end;

  perform cron.schedule('camply_anonymize_old_leads', '0 3 1 * *',
                        'select public.anonymize_old_leads()');
end $$;
