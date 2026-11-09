// Colunas de public.integrations que o navegador pode ler.
// access_token, refresh_token e app_secret ficam só no servidor (edge functions
// com service_role); a migration 20261108000027 revoga o SELECT dessas colunas
// para anon/authenticated (audit SEC-12). Nunca use select('*') nessa tabela.
// Literal único (não concatenado) para o supabase-js inferir o tipo das linhas.
export const INTEGRATION_SAFE_COLUMNS = 'id, user_id, provider, status, ad_account_id, page_id, token_expires_at, app_id, business_manager_id, created_at, updated_at, selected_accounts, selected_pages, app_id_origem, last_token_refresh, token_refresh_count, selected_ad_account_ids, selected_page_ids, selected_instagram_ids, selected_business_id, selected_waba_id, selected_whatsapp_phone_id, selected_whatsapp_display, selected_whatsapp_verified_name, meta_assets, is_syncing_campaigns';
