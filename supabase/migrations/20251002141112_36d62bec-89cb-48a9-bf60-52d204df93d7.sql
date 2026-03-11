-- =============================================
-- Migração Pagar.me V1 → V5
-- Etapa 1: Adicionar campos para Plan IDs V5
-- =============================================

-- Adicionar colunas para Plan IDs V5 (mensal e anual) por ambiente
ALTER TABLE public.pagarme_settings
ADD COLUMN IF NOT EXISTS test_plan_id_mensal TEXT,
ADD COLUMN IF NOT EXISTS test_plan_id_anual TEXT,
ADD COLUMN IF NOT EXISTS live_plan_id_mensal TEXT,
ADD COLUMN IF NOT EXISTS live_plan_id_anual TEXT;

COMMENT ON COLUMN public.pagarme_settings.test_plan_id_mensal IS 'Plan ID V5 para plano mensal no ambiente test';
COMMENT ON COLUMN public.pagarme_settings.test_plan_id_anual IS 'Plan ID V5 para plano anual no ambiente test';
COMMENT ON COLUMN public.pagarme_settings.live_plan_id_mensal IS 'Plan ID V5 para plano mensal no ambiente live';
COMMENT ON COLUMN public.pagarme_settings.live_plan_id_anual IS 'Plan ID V5 para plano anual no ambiente live';

-- Nota: encryption_key permanece na tabela mas não deve ser usada (V5 usa tokenizecard.js)
COMMENT ON COLUMN public.pagarme_settings.test_encryption_key IS 'DEPRECATED - V5 não usa encryption_key (usar tokenizecard.js)';
COMMENT ON COLUMN public.pagarme_settings.live_encryption_key IS 'DEPRECATED - V5 não usa encryption_key (usar tokenizecard.js)';

-- Drop e recriar função RPC para retornar novos campos (sem encryption_key)
DROP FUNCTION IF EXISTS public.get_pagarme_config_for_functions();

CREATE FUNCTION public.get_pagarme_config_for_functions()
RETURNS TABLE(
  secret_key TEXT,
  public_key TEXT,
  webhook_secret TEXT,
  environment TEXT,
  plan_id_mensal TEXT,
  plan_id_anual TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    CASE 
      WHEN ps.active_environment = 'test' THEN ps.test_secret_key
      ELSE ps.live_secret_key
    END as secret_key,
    CASE 
      WHEN ps.active_environment = 'test' THEN ps.test_public_key
      ELSE ps.live_public_key
    END as public_key,
    CASE 
      WHEN ps.active_environment = 'test' THEN ps.test_webhook_secret
      ELSE ps.live_webhook_secret
    END as webhook_secret,
    ps.active_environment as environment,
    CASE 
      WHEN ps.active_environment = 'test' THEN ps.test_plan_id_mensal
      ELSE ps.live_plan_id_mensal
    END as plan_id_mensal,
    CASE 
      WHEN ps.active_environment = 'test' THEN ps.test_plan_id_anual
      ELSE ps.live_plan_id_anual
    END as plan_id_anual
  FROM public.pagarme_settings ps
  ORDER BY ps.created_at DESC
  LIMIT 1;
$$;