-- Adicionar campo whatsapp_number em business_settings
ALTER TABLE business_settings
ADD COLUMN IF NOT EXISTS whatsapp_number text;

COMMENT ON COLUMN business_settings.whatsapp_number IS
'Número do WhatsApp do negócio no formato (XX) XXXXX-XXXX. Usado como padrão em campanhas e para auto-retry wa.me.';

-- Criar índice para buscar por whatsapp
CREATE INDEX IF NOT EXISTS idx_business_settings_whatsapp 
ON business_settings(whatsapp_number) 
WHERE whatsapp_number IS NOT NULL;