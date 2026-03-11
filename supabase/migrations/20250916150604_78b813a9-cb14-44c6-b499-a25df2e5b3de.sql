-- Add secret_key field to stripe_config table
ALTER TABLE public.stripe_config ADD COLUMN secret_key text;

-- Create function to get full Stripe configuration for edge functions
CREATE OR REPLACE FUNCTION public.get_stripe_config_for_functions()
RETURNS TABLE(
  secret_key text, 
  publishable_key text, 
  webhook_secret text, 
  environment text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT 
    sc.secret_key,
    sc.publishable_key,
    sc.webhook_secret,
    sc.environment
  FROM public.stripe_config sc
  LIMIT 1;
$function$;