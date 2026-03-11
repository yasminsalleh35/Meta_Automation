-- Migration 2: Criar tabela asaas_config
CREATE TABLE IF NOT EXISTS public.asaas_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  api_key text,
  webhook_secret text,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(environment)
);

-- Trigger para updated_at
CREATE TRIGGER update_asaas_config_updated_at
  BEFORE UPDATE ON public.asaas_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.asaas_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage asaas_config"
  ON public.asaas_config
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Função para edge functions
CREATE OR REPLACE FUNCTION public.get_asaas_config_for_functions(p_environment text DEFAULT 'sandbox')
RETURNS TABLE(
  api_key text,
  webhook_secret text,
  environment text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT 
    ac.api_key,
    ac.webhook_secret,
    ac.environment
  FROM public.asaas_config ac
  WHERE ac.environment = COALESCE(p_environment, 'sandbox')
  AND ac.is_active = true
  LIMIT 1;
$$;

COMMENT ON TABLE public.asaas_config IS 'Configurações do Asaas (API keys e webhooks)';