-- Corrigir política RLS para permitir admins acessarem stripe_config
-- Removemos a política atual e criamos uma nova que permite admin e super_admin

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