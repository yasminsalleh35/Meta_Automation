-- Adicionar colunas Asaas na tabela subscribers se não existirem
DO $$ 
BEGIN
  -- Adicionar asaas_customer_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscribers' 
    AND column_name = 'asaas_customer_id'
  ) THEN
    ALTER TABLE public.subscribers ADD COLUMN asaas_customer_id TEXT;
  END IF;

  -- Adicionar asaas_subscription_id se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'subscribers' 
    AND column_name = 'asaas_subscription_id'
  ) THEN
    ALTER TABLE public.subscribers ADD COLUMN asaas_subscription_id TEXT;
  END IF;
END $$;

-- Criar índices para os campos Asaas se não existirem
CREATE INDEX IF NOT EXISTS idx_subscribers_asaas_customer_id ON public.subscribers(asaas_customer_id);
CREATE INDEX IF NOT EXISTS idx_subscribers_asaas_subscription_id ON public.subscribers(asaas_subscription_id);