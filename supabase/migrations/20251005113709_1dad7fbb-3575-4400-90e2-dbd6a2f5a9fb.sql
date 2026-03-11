-- Migration: add_whatsapp_business_selection_to_integrations
-- Created: 2025-10-05
-- Purpose: Enable WhatsApp Business number selection for Meta Ads campaigns

ALTER TABLE public.integrations
  ADD COLUMN IF NOT EXISTS selected_business_id text NULL,
  ADD COLUMN IF NOT EXISTS selected_waba_id text NULL,
  ADD COLUMN IF NOT EXISTS selected_whatsapp_phone_id text NULL,
  ADD COLUMN IF NOT EXISTS selected_whatsapp_display text NULL,
  ADD COLUMN IF NOT EXISTS selected_whatsapp_verified_name text NULL;

COMMENT ON COLUMN public.integrations.selected_business_id IS 'ID do Business Manager selecionado para WhatsApp';
COMMENT ON COLUMN public.integrations.selected_waba_id IS 'ID da WhatsApp Business Account (WABA) selecionada';
COMMENT ON COLUMN public.integrations.selected_whatsapp_phone_id IS 'ID do número de telefone WhatsApp selecionado';
COMMENT ON COLUMN public.integrations.selected_whatsapp_display IS 'Número formatado para exibição (ex: +55 11 99999-9999)';
COMMENT ON COLUMN public.integrations.selected_whatsapp_verified_name IS 'Nome verificado do WhatsApp Business';