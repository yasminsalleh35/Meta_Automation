-- Adicionar coluna strategic_notes à tabela business_settings
ALTER TABLE public.business_settings 
ADD COLUMN strategic_notes text NULL;

-- Adicionar comentário descritivo
COMMENT ON COLUMN public.business_settings.strategic_notes IS 'Observações adicionais para relatórios estratégicos';