-- =============================================
-- Migration: Add Pagar.me Plan IDs to pagarme_config
-- Adds plan_id_mensal and plan_id_anual columns
-- Updates RPC to return these fields
-- =============================================

-- Add plan ID columns to pagarme_config
ALTER TABLE public.pagarme_config
ADD COLUMN IF NOT EXISTS plan_id_mensal TEXT,
ADD COLUMN IF NOT EXISTS plan_id_anual TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.pagarme_config.plan_id_mensal IS 'Pagar.me V5 Plan ID for monthly subscription (format: plan_xxxxx)';
COMMENT ON COLUMN public.pagarme_config.plan_id_anual IS 'Pagar.me V5 Plan ID for annual subscription (format: plan_xxxxx)';

-- Drop and recreate the RPC function to include new fields
DROP FUNCTION IF EXISTS public.get_pagarme_config_for_functions();

CREATE OR REPLACE FUNCTION public.get_pagarme_config_for_functions()
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
  LIMIT 1;
$$;