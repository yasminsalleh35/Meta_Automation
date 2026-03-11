-- =============================================
-- Correção CRÍTICA: Filtrar RPC por Environment
-- Garante que a RPC retorne o config correto baseado no ambiente
-- =============================================

-- Recriar função RPC com parâmetro p_environment
CREATE OR REPLACE FUNCTION public.get_pagarme_config_for_functions(p_environment text DEFAULT 'test')
RETURNS TABLE(
  secret_key text,
  public_key text,
  webhook_secret text,
  environment text,
  plan_id_mensal text,
  plan_id_anual text,
  account_id text,
  installments_max integer,
  free_installments integer,
  interest_rate numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    pc.secret_key,
    pc.public_key,
    pc.webhook_secret,
    pc.environment,
    pc.plan_id_mensal,
    pc.plan_id_anual,
    pc.account_id,
    pc.installments_max,
    pc.free_installments,
    pc.interest_rate
  FROM public.pagarme_config pc
  WHERE pc.environment = COALESCE(p_environment, 'test')
  LIMIT 1;
$$;