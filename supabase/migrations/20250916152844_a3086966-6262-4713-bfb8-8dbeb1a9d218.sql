-- Verificar se a função get_stripe_config_safe existe e criar se necessário
CREATE OR REPLACE FUNCTION public.get_stripe_config_safe()
 RETURNS TABLE(id uuid, publishable_key text, environment text, created_at timestamp with time zone, updated_at timestamp with time zone, has_webhook_secret boolean)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT 
    sc.id,
    sc.publishable_key,
    sc.environment,
    sc.created_at,
    sc.updated_at,
    (sc.webhook_secret IS NOT NULL AND sc.webhook_secret != '') as has_webhook_secret
  FROM public.stripe_config sc
  WHERE EXISTS (
    SELECT 1 
    FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
  LIMIT 1;
$function$

-- Verificar e ajustar as políticas RLS da tabela stripe_config
-- A política atual permite apenas super_admin, vamos permitir admin também
DROP POLICY IF EXISTS "super_admin_full_access_stripe_config" ON public.stripe_config;

CREATE POLICY "admin_full_access_stripe_config" 
ON public.stripe_config 
FOR ALL 
TO authenticated 
USING (EXISTS ( 
  SELECT 1
  FROM user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role IN ('admin', 'super_admin')
))
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role IN ('admin', 'super_admin')
));