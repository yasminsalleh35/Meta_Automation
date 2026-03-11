-- Drop and recreate get_pagarme_config_for_functions to use pagarme_settings table
DROP FUNCTION IF EXISTS public.get_pagarme_config_for_functions();

CREATE OR REPLACE FUNCTION public.get_pagarme_config_for_functions()
RETURNS TABLE(
  secret_key text,
  public_key text,
  encryption_key text,
  webhook_secret text,
  environment text,
  stripe_custom_payment_method_id text,
  installments_max integer,
  free_installments integer,
  interest_rate numeric
)
LANGUAGE sql
STABLE 
SECURITY DEFINER
SET search_path TO 'public'
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
      WHEN ps.active_environment = 'test' THEN ps.test_encryption_key
      ELSE ps.live_encryption_key
    END as encryption_key,
    CASE 
      WHEN ps.active_environment = 'test' THEN ps.test_webhook_secret
      ELSE ps.live_webhook_secret
    END as webhook_secret,
    ps.active_environment as environment,
    NULL::text as stripe_custom_payment_method_id,
    12 as installments_max,
    0 as free_installments,
    NULL::numeric as interest_rate
  FROM public.pagarme_settings ps
  ORDER BY ps.created_at DESC
  LIMIT 1;
$$;