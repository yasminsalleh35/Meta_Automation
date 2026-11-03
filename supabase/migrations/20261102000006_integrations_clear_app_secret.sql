-- =============================================
-- Audit SEC-12 (2026-11-02): integrations.app_secret não deve existir por usuário
-- O app secret é global (meta_ads_config, só service_role). Cópias em integrations eram
-- legíveis pelo navegador via select('*'). Nenhuma edge function lê esta coluna.
-- =============================================
begin;
update public.integrations set app_secret = null where app_secret is not null;
comment on column public.integrations.app_secret is 'DEPRECATED (audit SEC-12): sempre NULL. Use meta_ads_config via service_role.';
commit;
