-- Create public function for Pagar.me config (non-sensitive fields)
-- Accessible to all authenticated users to enable installment payments

CREATE OR REPLACE FUNCTION public.get_pagarme_config_public()
RETURNS TABLE(
  id uuid,
  environment text,
  public_key text,
  stripe_custom_payment_method_id text,
  installments_max integer,
  free_installments integer,
  interest_rate numeric,
  statement_descriptor text,
  account_id text,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  has_secret_key boolean,
  has_webhook_secret boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    pc.id,
    pc.environment,
    pc.public_key,
    pc.stripe_custom_payment_method_id,
    pc.installments_max,
    pc.free_installments,
    pc.interest_rate,
    pc.statement_descriptor,
    pc.account_id,
    pc.created_at,
    pc.updated_at,
    (pc.secret_key IS NOT NULL AND pc.secret_key != '') as has_secret_key,
    (pc.webhook_secret IS NOT NULL AND pc.webhook_secret != '') as has_webhook_secret
  FROM public.pagarme_config pc
  WHERE auth.uid() IS NOT NULL  -- Only authenticated users
  LIMIT 1;
$function$;