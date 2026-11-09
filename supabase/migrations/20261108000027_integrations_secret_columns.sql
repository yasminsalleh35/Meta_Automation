-- =============================================
-- Audit SEC-12 (2026-11-08): segredos Meta legíveis pelo navegador em public.integrations
-- anon/authenticated tinham SELECT na tabela inteira e a policy
-- "Users can view their own integrations" (auth.uid() = user_id) deixava o usuário ler o
-- próprio access_token/refresh_token/app_secret — qualquer XSS exfiltrava o token Meta.
-- Agora o SELECT é por coluna e exclui os segredos; só service_role (edge functions) os lê.
-- O frontend usa INTEGRATION_SAFE_COLUMNS (src/lib/integrationColumns.ts), nunca select('*').
-- INSERT/UPDATE/DELETE ficam como estão (o OAuth ainda grava o token via cliente; escrever
-- não permite ler de volta). RLS continua valendo para as colunas liberadas.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

revoke select on public.integrations from anon, authenticated;

grant select (
  id,
  user_id,
  provider,
  status,
  ad_account_id,
  page_id,
  token_expires_at,
  app_id,
  business_manager_id,
  created_at,
  updated_at,
  selected_accounts,
  selected_pages,
  app_id_origem,
  last_token_refresh,
  token_refresh_count,
  selected_ad_account_ids,
  selected_page_ids,
  selected_instagram_ids,
  selected_business_id,
  selected_waba_id,
  selected_whatsapp_phone_id,
  selected_whatsapp_display,
  selected_whatsapp_verified_name,
  meta_assets,
  is_syncing_campaigns
) on public.integrations to authenticated;
