-- =============================================
-- Audit LGL-04 (2026-11-09): e-mails de marketing desligados por padrão + registro do consentimento
-- NotificationsSection só simulava o salvamento (setTimeout) e mostrava "Emails de Marketing"
-- ligado por padrão. Agora as preferências ficam em profiles:
--   marketing_emails_opt_in  boolean  not null default false  (todos começam SEM consentimento:
--                                     ninguém tinha consentimento armazenado; o default do
--                                     add column já grava false em todas as linhas existentes)
--   marketing_consent_at     timestamptz  now() quando liga, null quando desliga
--   notification_preferences jsonb    demais chaves da tela (emailNotifications, pushNotifications,
--                                     campaignAlerts, weeklyReports, systemUpdates)
-- O próprio usuário atualiza a linha (policy "Users can update their own profile"); o trigger
-- abaixo deriva marketing_consent_at, então o cliente não consegue forjar a data do consentimento.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

alter table public.profiles
  add column if not exists marketing_emails_opt_in boolean not null default false,
  add column if not exists marketing_consent_at timestamptz,
  add column if not exists notification_preferences jsonb not null default '{}'::jsonb;

comment on column public.profiles.marketing_emails_opt_in is
  'audit LGL-04: consentimento para e-mails de marketing (opt-in, default false).';
comment on column public.profiles.marketing_consent_at is
  'audit LGL-04: quando o opt-in de marketing foi dado (null = sem consentimento). Preenchido por trigger.';
comment on column public.profiles.notification_preferences is
  'audit LGL-04: preferências de notificação não-marketing da tela de Configurações.';

do $$
begin
  if not exists (select 1 from pg_constraint
                 where conrelid = 'public.profiles'::regclass
                   and conname = 'profiles_notification_preferences_object') then
    alter table public.profiles
      add constraint profiles_notification_preferences_object
      check (jsonb_typeof(notification_preferences) = 'object');
  end if;
end $$;

-- marketing_consent_at é sempre derivado de marketing_emails_opt_in
create or replace function public.profiles_stamp_marketing_consent()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.marketing_consent_at := case when new.marketing_emails_opt_in then now() end;
  elsif new.marketing_emails_opt_in is distinct from old.marketing_emails_opt_in then
    new.marketing_consent_at := case when new.marketing_emails_opt_in then now() end;
  else
    new.marketing_consent_at := old.marketing_consent_at;
  end if;
  return new;
end $$;

revoke all on function public.profiles_stamp_marketing_consent() from public, anon, authenticated;

drop trigger if exists profiles_stamp_marketing_consent on public.profiles;
create trigger profiles_stamp_marketing_consent
  before insert or update on public.profiles
  for each row execute function public.profiles_stamp_marketing_consent();
