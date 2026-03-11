-- Fix Pagar.me saving issue: Add admin role and update config function

-- 1. Insert admin role for current user (if doesn't exist)
INSERT INTO public.user_roles (user_id, role)
SELECT auth.uid(), 'admin'::app_role
WHERE auth.uid() IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );

-- 2. Update get_pagarme_config_safe function to include account_id
CREATE OR REPLACE FUNCTION public.get_pagarme_config_safe()
RETURNS TABLE(
  id uuid, 
  environment text, 
  public_key text, 
  account_id text,
  stripe_custom_payment_method_id text, 
  installments_max integer, 
  free_installments integer, 
  interest_rate numeric, 
  statement_descriptor text, 
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
    pc.account_id,
    pc.stripe_custom_payment_method_id,
    pc.installments_max,
    pc.free_installments,
    pc.interest_rate,
    pc.statement_descriptor,
    pc.created_at,
    pc.updated_at,
    (pc.secret_key IS NOT NULL AND pc.secret_key != '') as has_secret_key,
    (pc.webhook_secret IS NOT NULL AND pc.webhook_secret != '') as has_webhook_secret
  FROM public.pagarme_config pc
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
  LIMIT 1;
$function$;