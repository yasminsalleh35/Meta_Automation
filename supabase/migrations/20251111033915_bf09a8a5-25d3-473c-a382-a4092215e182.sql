-- Tabela para armazenar tentativas de criação de campanhas que falharam
CREATE TABLE IF NOT EXISTS public.campaign_contingency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Status da contingência
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
  
  -- Dados completos da tentativa de criação
  campaign_data JSONB NOT NULL,
  
  -- Informações do erro
  error_message TEXT,
  error_stack TEXT,
  error_stage TEXT,
  meta_api_trace_id TEXT,
  
  -- IDs parcialmente criados (se houver)
  partial_meta_campaign_id TEXT,
  partial_meta_adset_id TEXT,
  partial_meta_creative_id TEXT,
  partial_meta_ad_id TEXT,
  
  -- Dados da integração Meta Ads no momento do erro
  ad_account_id TEXT,
  page_id TEXT,
  instagram_id TEXT,
  access_token_preview TEXT,
  
  -- Informações administrativas
  admin_notes TEXT,
  completed_by UUID REFERENCES auth.users(id),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadados
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  attempts INT DEFAULT 0
);

-- Índices para performance
CREATE INDEX idx_campaign_contingency_user_id ON public.campaign_contingency(user_id);
CREATE INDEX idx_campaign_contingency_status ON public.campaign_contingency(status);
CREATE INDEX idx_campaign_contingency_created_at ON public.campaign_contingency(created_at DESC);

-- RLS Policies
ALTER TABLE public.campaign_contingency ENABLE ROW LEVEL SECURITY;

-- Admins podem ver todas as contingências
CREATE POLICY "Admins can view all contingencies"
ON public.campaign_contingency
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Admins podem atualizar contingências
CREATE POLICY "Admins can update contingencies"
ON public.campaign_contingency
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role IN ('admin', 'super_admin')
  )
);

-- Sistema pode inserir contingências
CREATE POLICY "System can insert contingencies"
ON public.campaign_contingency
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_campaign_contingency_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

CREATE TRIGGER trigger_update_campaign_contingency_updated_at
BEFORE UPDATE ON public.campaign_contingency
FOR EACH ROW
EXECUTE FUNCTION update_campaign_contingency_updated_at();