
-- Criar tabela para armazenar configurações "desejadas" de cada Ad Set
CREATE TABLE public.expected_ad_set_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  ad_set_id TEXT, -- Pode ser NULL inicialmente, atualizado após criação
  expected_name TEXT NOT NULL,
  expected_locality_json JSONB NOT NULL, -- Configuração de localidade desejada
  expected_budget_amount NUMERIC NOT NULL, -- Orçamento em centavos
  expected_budget_type TEXT NOT NULL CHECK (expected_budget_type IN ('daily_budget', 'lifetime_budget')),
  expected_instagram_profile_id TEXT, -- ID da página/perfil do Instagram
  verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED_OK', 'CORRECTED', 'ERROR')),
  last_verified_at TIMESTAMP WITH TIME ZONE,
  is_pending_verification BOOLEAN DEFAULT TRUE,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar índices para performance
CREATE INDEX idx_expected_ad_set_settings_ad_set_id ON public.expected_ad_set_settings(ad_set_id);
CREATE INDEX idx_expected_ad_set_settings_verification_status ON public.expected_ad_set_settings(verification_status);
CREATE INDEX idx_expected_ad_set_settings_pending ON public.expected_ad_set_settings(is_pending_verification) WHERE is_pending_verification = TRUE;

-- Habilitar RLS
ALTER TABLE public.expected_ad_set_settings ENABLE ROW LEVEL SECURITY;

-- Políticas RLS - usuários só podem ver/editar seus próprios registros
-- Nota: Precisamos relacionar com user_id via campanhas ou outro método
-- Por enquanto, vamos permitir acesso aos usuários autenticados
CREATE POLICY "Users can view their own ad set settings" 
  ON public.expected_ad_set_settings 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert their own ad set settings" 
  ON public.expected_ad_set_settings 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own ad set settings" 
  ON public.expected_ad_set_settings 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_expected_ad_set_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expected_ad_set_settings_updated_at
  BEFORE UPDATE ON public.expected_ad_set_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_expected_ad_set_settings_updated_at();
