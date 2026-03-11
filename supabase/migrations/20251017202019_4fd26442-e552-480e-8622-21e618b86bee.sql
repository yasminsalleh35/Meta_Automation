-- ============================================================
-- FASE 1: LIMPEZA AUTOMÁTICA NA TROCA DE INTEGRAÇÃO
-- ============================================================

-- Função que limpa campanhas antigas ao trocar ad_account_id
CREATE OR REPLACE FUNCTION clean_old_campaigns_on_integration_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Se o ad_account_id mudou (e não é null para null)
  IF OLD.ad_account_id IS DISTINCT FROM NEW.ad_account_id 
     AND NEW.ad_account_id IS NOT NULL THEN
    
    -- Apagar campanhas do ad_account_id antigo
    DELETE FROM public.campaigns
    WHERE user_id = NEW.user_id
      AND ad_account_id = OLD.ad_account_id;
    
    RAISE NOTICE 'Campanhas antigas removidas: ad_account_id % → %', 
                 OLD.ad_account_id, NEW.ad_account_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Criar trigger na tabela integrations
DROP TRIGGER IF EXISTS trigger_clean_campaigns_on_ad_account_change ON public.integrations;
CREATE TRIGGER trigger_clean_campaigns_on_ad_account_change
  BEFORE UPDATE ON public.integrations
  FOR EACH ROW
  EXECUTE FUNCTION clean_old_campaigns_on_integration_change();

-- ============================================================
-- FASE 2: CACHE PERSISTENTE DE CAMPANHAS
-- ============================================================

-- Adicionar colunas para armazenar dados Meta completos
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS meta_data JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS meta_data_cached_at TIMESTAMP WITH TIME ZONE;

-- Índice GIN para buscar dentro do JSONB
CREATE INDEX IF NOT EXISTS idx_campaigns_meta_data 
  ON public.campaigns USING GIN (meta_data);

-- Comentário explicativo
COMMENT ON COLUMN public.campaigns.meta_data IS 
  'Cache completo dos dados da campanha no Meta (ads, page, instagram, insights). TTL estrutural: 24h, métricas: 15min';

COMMENT ON COLUMN public.campaigns.meta_data_cached_at IS 
  'Timestamp da última atualização do cache meta_data';