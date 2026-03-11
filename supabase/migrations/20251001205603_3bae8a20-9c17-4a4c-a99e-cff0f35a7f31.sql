-- Adicionar encryption_key a pagarme_settings se não existir
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'pagarme_settings' 
    AND column_name = 'test_encryption_key'
  ) THEN
    ALTER TABLE public.pagarme_settings 
    ADD COLUMN test_encryption_key text,
    ADD COLUMN live_encryption_key text;
    
    COMMENT ON COLUMN public.pagarme_settings.test_encryption_key IS 'Pagar.me encryption key for test environment (starts with ek_test_)';
    COMMENT ON COLUMN public.pagarme_settings.live_encryption_key IS 'Pagar.me encryption key for live environment (starts with ek_live_)';
  END IF;
END $$;

-- Atualizar função get_pagarme_config_for_functions para incluir encryption_key
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
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
$function$;