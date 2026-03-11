-- Adicionar UNIQUE constraint para permitir upsert com onConflict
ALTER TABLE public.campaigns 
ADD CONSTRAINT campaigns_meta_campaign_id_unique 
UNIQUE (meta_campaign_id);

-- Criar índice para performance em meta_campaign_id
CREATE INDEX IF NOT EXISTS idx_campaigns_meta_campaign_id 
ON public.campaigns(meta_campaign_id);

-- Criar índice composto para queries filtradas por user + ad_account
CREATE INDEX IF NOT EXISTS idx_campaigns_user_ad_account 
ON public.campaigns(user_id, ad_account_id);