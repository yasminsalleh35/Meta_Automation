-- Adicionar coluna para armazenar valores de ticket médio por especialidade
ALTER TABLE public.business_settings 
ADD COLUMN IF NOT EXISTS specialty_tickets JSONB DEFAULT '{}'::jsonb;