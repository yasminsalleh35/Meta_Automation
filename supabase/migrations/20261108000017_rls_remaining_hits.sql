-- =============================================
-- Audit DATA-07 (2026-11-08): hits restantes do Apêndice A, query 1
-- * subscribers."subscribers_owner_or_admin" (FOR ALL, auth.uid() = user_id): o usuário podia
--   INSERT/UPDATE na própria assinatura (is_active, plan_type, subscription_status...) e se
--   dar acesso pago. O cliente só lê subscribers; escrita é feita pelas functions
--   (service_role). Leitura continua coberta por "Users can view their own subscription",
--   select_own_subscription e "Admins can view all subscriptions".
-- * login_attempts."login_attempts_insert" (authenticated, WITH CHECK true): tabela sem uso
--   no código (0 linhas); permitia qualquer usuário inserir tentativas arbitrárias.
-- Sem begin/commit: rodar com psql -1 (transação única).
-- =============================================

drop policy if exists "subscribers_owner_or_admin" on public.subscribers;
drop policy if exists "login_attempts_insert" on public.login_attempts;
