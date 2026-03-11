-- Criar função administrativa segura para configurações de IA (não expõe API keys)
CREATE OR REPLACE FUNCTION public.get_ai_configurations_admin_safe()
 RETURNS TABLE(id uuid, provider text, model_name text, max_tokens integer, temperature numeric, is_active boolean, is_default boolean, created_at timestamp with time zone, updated_at timestamp with time zone, has_api_key boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  -- Apenas permite super admins chamar esta função e não expõe api_key
  SELECT 
    ac.id,
    ac.provider,
    ac.model_name,
    ac.max_tokens,
    ac.temperature,
    ac.is_active,
    ac.is_default,
    ac.created_at,
    ac.updated_at,
    (ac.api_key IS NOT NULL AND ac.api_key != '') as has_api_key
  FROM public.ai_configurations ac
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  );
$function$