-- Adicionar colunas de Language Targeting na tabela campaign_profiles
ALTER TABLE campaign_profiles
ADD COLUMN enable_language_targeting boolean NOT NULL DEFAULT false,
ADD COLUMN languages jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Adicionar comentários para documentação
COMMENT ON COLUMN campaign_profiles.enable_language_targeting IS 'Ativa o language targeting para este perfil';
COMMENT ON COLUMN campaign_profiles.languages IS 'Array de códigos de idioma no formato ISO (ex: ["pt_BR", "en_US"])';