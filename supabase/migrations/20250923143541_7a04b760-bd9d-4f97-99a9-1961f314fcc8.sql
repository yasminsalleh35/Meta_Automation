-- Criar função pública para verificar status da IA configurada pelo admin
-- Esta função permite que usuários autenticados vejam se existe uma configuração ativa de IA
-- sem expor as chaves de API por segurança

CREATE OR REPLACE FUNCTION public.get_ai_status()
RETURNS TABLE(
  is_available boolean,
  provider text,
  model_name text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT 
    (ac.is_active AND ac.api_key IS NOT NULL AND ac.api_key != '') as is_available,
    ac.provider,
    ac.model_name
  FROM public.ai_configurations ac
  WHERE ac.is_active = true
  AND ac.is_default = true
  LIMIT 1;
$$;