-- Remove política antiga que pode estar conflitando
DROP POLICY IF EXISTS "super_admin_full_access_stripe_config" ON public.stripe_config;

-- Garantir que a política atual está correta
DROP POLICY IF EXISTS "admin_full_access_stripe_config" ON public.stripe_config;

CREATE POLICY "admin_full_access_stripe_config" 
ON public.stripe_config 
FOR ALL 
TO authenticated 
USING (EXISTS ( 
  SELECT 1
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role IN ('admin', 'super_admin')
))
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role IN ('admin', 'super_admin')
));