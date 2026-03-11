-- Adicionar coluna para armazenar URL do preview vindo do Meta
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS media_preview_url TEXT;

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_campaigns_media_preview 
ON campaigns(media_preview_url) 
WHERE media_preview_url IS NOT NULL;

-- Comentário explicativo
COMMENT ON COLUMN campaigns.media_preview_url IS 
'URL do preview da mídia do anúncio, sincronizada do Meta Ads API';