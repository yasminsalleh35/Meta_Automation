-- Migration 1: Estender tabela subscribers para Asaas
ALTER TABLE public.subscribers
ADD COLUMN IF NOT EXISTS asaas_customer_id text,
ADD COLUMN IF NOT EXISTS asaas_subscription_id text;

-- Criar índices para otimizar buscas
CREATE INDEX IF NOT EXISTS idx_subscribers_asaas_customer 
ON public.subscribers(asaas_customer_id) WHERE asaas_customer_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscribers_asaas_subscription 
ON public.subscribers(asaas_subscription_id) WHERE asaas_subscription_id IS NOT NULL;

-- Comentários
COMMENT ON COLUMN public.subscribers.asaas_customer_id IS 'ID do cliente no Asaas (cus_...)';
COMMENT ON COLUMN public.subscribers.asaas_subscription_id IS 'ID da assinatura no Asaas (sub_...)';