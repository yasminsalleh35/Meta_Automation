-- Migration 3: Criar tabela asaas_plans
CREATE TABLE IF NOT EXISTS public.asaas_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  internal_slug text NOT NULL,
  name text NOT NULL,
  description text,
  amount numeric(10,2) NOT NULL,
  billing_type text NOT NULL DEFAULT 'CREDIT_CARD' CHECK (billing_type IN ('CREDIT_CARD', 'BOLETO', 'PIX')),
  cycle text NOT NULL CHECK (cycle IN ('MONTHLY', 'YEARLY', 'WEEKLY', 'BIMONTHLY', 'QUARTERLY', 'SEMIANNUALLY')),
  max_installment_count integer NOT NULL DEFAULT 1,
  charge_type text NOT NULL DEFAULT 'RECURRENT' CHECK (charge_type = 'RECURRENT'),
  environment text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  is_active boolean NOT NULL DEFAULT true,
  is_default_monthly boolean NOT NULL DEFAULT false,
  is_default_annual boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  UNIQUE(internal_slug, environment)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_asaas_plans_slug ON public.asaas_plans(internal_slug);
CREATE INDEX IF NOT EXISTS idx_asaas_plans_active ON public.asaas_plans(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_asaas_plans_defaults ON public.asaas_plans(is_default_monthly, is_default_annual) 
WHERE is_default_monthly = true OR is_default_annual = true;

-- Trigger
CREATE TRIGGER update_asaas_plans_updated_at
  BEFORE UPDATE ON public.asaas_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.asaas_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active asaas_plans"
  ON public.asaas_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage asaas_plans"
  ON public.asaas_plans
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE public.asaas_plans IS 'Planos de assinatura Asaas configurados no Camply';

-- Inserir planos padrão
INSERT INTO public.asaas_plans (internal_slug, name, description, amount, cycle, max_installment_count, environment, is_default_monthly)
VALUES ('camply_monthly', 'Camply Mensal', 'Plano mensal do Camply', 349.99, 'MONTHLY', 1, 'sandbox', true)
ON CONFLICT (internal_slug, environment) DO NOTHING;

INSERT INTO public.asaas_plans (internal_slug, name, description, amount, cycle, max_installment_count, environment, is_default_annual)
VALUES ('camply_annual', 'Camply Anual', 'Plano anual do Camply (12x sem juros)', 2499.99, 'YEARLY', 12, 'sandbox', true)
ON CONFLICT (internal_slug, environment) DO NOTHING;

INSERT INTO public.asaas_plans (internal_slug, name, description, amount, cycle, max_installment_count, environment, is_default_monthly)
VALUES ('camply_monthly', 'Camply Mensal', 'Plano mensal do Camply', 349.99, 'MONTHLY', 1, 'production', true)
ON CONFLICT (internal_slug, environment) DO NOTHING;

INSERT INTO public.asaas_plans (internal_slug, name, description, amount, cycle, max_installment_count, environment, is_default_annual)
VALUES ('camply_annual', 'Camply Anual', 'Plano anual do Camply (12x sem juros)', 2499.99, 'YEARLY', 12, 'production', true)
ON CONFLICT (internal_slug, environment) DO NOTHING;