-- Corrigir problemas de segurança - tentar abordagem diferente

-- 1. Ativar RLS na tabela de rate limiting (se ainda não estiver)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' AND c.relname = 'lead_rate_limit'
    AND c.relrowsecurity = true
  ) THEN
    ALTER TABLE public.lead_rate_limit ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 2. Recriar a função com search_path correto
DROP TRIGGER IF EXISTS update_leads_updated_at ON public.leads;

CREATE OR REPLACE FUNCTION public.update_leads_updated_at()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Recriar o trigger
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leads_updated_at();