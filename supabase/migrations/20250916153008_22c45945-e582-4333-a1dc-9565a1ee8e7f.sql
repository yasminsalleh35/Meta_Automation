-- Dar permissão de admin ao usuário atual para configurar o Stripe
-- Primeiro, verificamos se o usuário já tem role, se não, inserimos como admin

INSERT INTO public.user_roles (user_id, role)
SELECT auth.uid(), 'admin'::app_role
WHERE auth.uid() IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid()
  );