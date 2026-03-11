-- Corrigir problemas de segurança detectados

-- 1. Ativar RLS na tabela de rate limiting
ALTER TABLE public.lead_rate_limit ENABLE ROW LEVEL SECURITY;

-- Política para rate limiting (apenas Edge Functions podem inserir/atualizar)
CREATE POLICY "rate_limit_service_only" ON public.lead_rate_limit
  FOR ALL USING (false); -- Apenas service role pode acessar

-- 2. Corrigir função com search_path seguro
DROP FUNCTION IF EXISTS update_leads_updated_at();

CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;