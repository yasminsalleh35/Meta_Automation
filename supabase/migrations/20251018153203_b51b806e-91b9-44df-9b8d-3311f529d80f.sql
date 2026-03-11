-- Remove trigger problemático que causa race condition
DROP TRIGGER IF EXISTS trigger_clean_campaigns_on_ad_account_change ON public.integrations;

-- Adicionar coluna de controle de sincronização
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS is_syncing_campaigns BOOLEAN DEFAULT false;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.integrations.is_syncing_campaigns IS 'Flag para prevenir chamadas simultâneas de sincronização de campanhas';