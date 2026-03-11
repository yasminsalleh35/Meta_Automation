-- Drop the existing policy that's missing WITH CHECK
DROP POLICY IF EXISTS "Admins can manage pagarme settings" ON public.pagarme_settings;

-- Create new policy with both USING and WITH CHECK expressions
CREATE POLICY "Admins can manage pagarme settings" 
ON public.pagarme_settings
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_roles.user_id = auth.uid() 
    AND user_roles.role IN ('admin', 'super_admin')
  )
);