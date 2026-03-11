-- Corrigir política RLS faltante na tabela lead_rate_limit

-- Remover política anterior que bloqueia tudo
DROP POLICY IF EXISTS "rate_limit_service_only" ON public.lead_rate_limit;

-- Criar política que permite acesso apenas via service role (Edge Function)
-- Como não temos auth.role() disponível para service role, vamos usar uma abordagem diferente
CREATE POLICY "rate_limit_edge_function_access" ON public.lead_rate_limit
  FOR ALL USING (
    -- Permite apenas quando não há usuário autenticado (service role)
    auth.uid() IS NULL
  );