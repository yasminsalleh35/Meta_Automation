-- ============================================
-- META ASSETS CACHE OPTIMIZATION (Phase 1)
-- ============================================
-- Adicionar coluna para cache persistente de ativos Meta
-- conforme documentação Meta v23.0 (ativos estáveis devem ser cached)

-- 1. Adicionar coluna meta_assets na tabela integrations
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS meta_assets JSONB DEFAULT '{}'::jsonb;

-- 2. Adicionar comentário descritivo
COMMENT ON COLUMN public.integrations.meta_assets IS 
'Cache persistente (TTL 24h) de ativos Meta: Facebook Pages, Instagram Accounts, Ad Accounts. 
Estrutura: {
  "facebookPages": [{"id", "name", "pictureUrl", "whatsappNumber", "whatsappVerifiedName"}],
  "instagramAccounts": [{"id", "name", "pageId", "profilePictureUrl"}],
  "adAccounts": [{"id", "name", "currency", "status", "permissions"}],
  "cached_at": "ISO8601 timestamp",
  "expires_at": "ISO8601 timestamp"
}';

-- 3. Criar índice para acelerar queries por user_id
CREATE INDEX IF NOT EXISTS idx_integrations_meta_assets_gin 
ON public.integrations USING GIN (meta_assets);

-- 4. Log para auditoria
DO $$ 
BEGIN 
  RAISE NOTICE 'Meta Assets Cache: coluna meta_assets adicionada com sucesso'; 
END $$;