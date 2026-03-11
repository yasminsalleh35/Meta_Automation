-- Criar função administrativa segura que inclui emails (apenas para admins verificados)
CREATE OR REPLACE FUNCTION public.get_profiles_admin_with_email()
 RETURNS TABLE(id uuid, name text, email text, created_at timestamp with time zone, updated_at timestamp with time zone, last_login_at timestamp with time zone, status text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Apenas permite administradores chamar esta função e retornar emails
  SELECT 
    p.id,
    p.name,
    p.email,
    p.created_at,
    p.updated_at,
    p.last_login_at,
    p.status
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  );
$function$