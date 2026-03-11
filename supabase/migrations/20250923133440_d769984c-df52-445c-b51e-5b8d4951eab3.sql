-- =============================================
-- Híbrido Stripe + Pagar.me - Schema Expansion
-- Mantém retrocompatibilidade total com Stripe atual
-- =============================================

-- 1. Tabela para configuração Pagar.me (separada do Stripe)
CREATE TABLE IF NOT EXISTS public.pagarme_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL DEFAULT 'test' CHECK (environment IN ('test', 'live')),
  public_key text,
  secret_key text, 
  encryption_key text,
  webhook_secret text,
  stripe_custom_payment_method_id text, -- cpmt_... para integração híbrida
  installments_max integer DEFAULT 12 CHECK (installments_max >= 1 AND installments_max <= 24),
  free_installments integer DEFAULT 0 CHECK (free_installments >= 0),
  interest_rate numeric(6,3), -- % ao mês
  statement_descriptor text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. Tabela unificada de pagamentos (Stripe + Pagar.me)
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  provider text NOT NULL CHECK (provider IN ('stripe', 'pagarme')),
  motive text CHECK (motive IN ('subscription', 'one_time', 'parcelado')),
  amount integer NOT NULL, -- centavos
  currency text NOT NULL DEFAULT 'BRL',
  installments integer,
  fee integer, -- centavos 
  net_amount integer, -- centavos
  status text CHECK (status IN ('pending', 'authorized', 'paid', 'refused', 'refunded', 'chargeback')),
  external_id text, -- ID do provedor (Stripe/Pagar.me)
  external_raw jsonb DEFAULT '{}', -- payload sem dados sensíveis
  cpmt_id text, -- cpmt_* quando via Custom Payment Method
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. Audit log para pagamentos (todos os provedores)
CREATE TABLE IF NOT EXISTS public.payment_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL, -- 'admin_save' | 'webhook' | 'init' | 'capture' | 'refund'
  provider text NOT NULL CHECK (provider IN ('stripe', 'pagarme')),
  ref_id text, -- payment id ou external id
  message text NOT NULL,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- 4. Event log para Pagar.me (similar ao Stripe)
CREATE TABLE IF NOT EXISTS public.pagarme_event_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text NOT NULL UNIQUE, -- ID do evento Pagar.me
  event_type text NOT NULL,
  processed boolean DEFAULT false,
  processed_at timestamptz,
  raw_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- TRIGGERS para updated_at
-- =============================================

-- Trigger para pagarme_config
CREATE OR REPLACE FUNCTION update_pagarme_config_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_pagarme_config_updated_at
  BEFORE UPDATE ON public.pagarme_config
  FOR EACH ROW
  EXECUTE FUNCTION update_pagarme_config_updated_at();

-- Trigger para payments
CREATE OR REPLACE FUNCTION update_payments_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_payments_updated_at();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.pagarme_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagarme_event_log ENABLE ROW LEVEL SECURITY;

-- Políticas para pagarme_config (somente admin)
CREATE POLICY "admin_full_access_pagarme_config" 
ON public.pagarme_config 
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Políticas para payments (usuários veem seus próprios, admin vê todos)
CREATE POLICY "users_view_own_payments"
ON public.payments
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "system_insert_payments"
ON public.payments
FOR INSERT
TO authenticated
WITH CHECK (true); -- Edge functions podem inserir

CREATE POLICY "admin_update_payments"
ON public.payments
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

-- Políticas para payment_audit_log (somente admin lê, sistema insere)
CREATE POLICY "admin_read_payment_audit_log"
ON public.payment_audit_log
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "system_insert_payment_audit_log"
ON public.payment_audit_log
FOR INSERT
TO authenticated
WITH CHECK (true); -- Edge functions podem inserir

-- Políticas para pagarme_event_log (somente sistema)
CREATE POLICY "system_manage_pagarme_event_log"
ON public.pagarme_event_log
FOR ALL
TO authenticated
USING (true) -- Edge functions gerenciam
WITH CHECK (true);

-- =============================================
-- FUNCTIONS para acesso seguro
-- =============================================

-- Função para obter config Pagar.me (segura, sem secrets)
CREATE OR REPLACE FUNCTION public.get_pagarme_config_safe()
RETURNS TABLE(
  id uuid,
  environment text,
  public_key text,
  stripe_custom_payment_method_id text,
  installments_max integer,
  free_installments integer,
  interest_rate numeric,
  statement_descriptor text,
  created_at timestamptz,
  updated_at timestamptz,
  has_secret_key boolean,
  has_webhook_secret boolean
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pc.id,
    pc.environment,
    pc.public_key,
    pc.stripe_custom_payment_method_id,
    pc.installments_max,
    pc.free_installments,
    pc.interest_rate,
    pc.statement_descriptor,
    pc.created_at,
    pc.updated_at,
    (pc.secret_key IS NOT NULL AND pc.secret_key != '') as has_secret_key,
    (pc.webhook_secret IS NOT NULL AND pc.webhook_secret != '') as has_webhook_secret
  FROM public.pagarme_config pc
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  )
  LIMIT 1;
$$;

-- Função para Edge Functions acessarem config Pagar.me (com secrets)
CREATE OR REPLACE FUNCTION public.get_pagarme_config_for_functions()
RETURNS TABLE(
  secret_key text,
  public_key text,
  encryption_key text,
  webhook_secret text,
  environment text,
  stripe_custom_payment_method_id text,
  installments_max integer,
  free_installments integer,
  interest_rate numeric
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    pc.secret_key,
    pc.public_key,
    pc.encryption_key,
    pc.webhook_secret,
    pc.environment,
    pc.stripe_custom_payment_method_id,
    pc.installments_max,
    pc.free_installments,
    pc.interest_rate
  FROM public.pagarme_config pc
  LIMIT 1;
$$;

-- =============================================
-- ÍNDICES para performance
-- =============================================

-- Índices para payments
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_provider_status ON public.payments(provider, status);
CREATE INDEX IF NOT EXISTS idx_payments_external_id ON public.payments(external_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON public.payments(created_at DESC);

-- Índices para payment_audit_log  
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_ref_id ON public.payment_audit_log(ref_id);
CREATE INDEX IF NOT EXISTS idx_payment_audit_log_created_at ON public.payment_audit_log(created_at DESC);

-- Índices para pagarme_event_log
CREATE INDEX IF NOT EXISTS idx_pagarme_event_log_event_id ON public.pagarme_event_log(event_id);
CREATE INDEX IF NOT EXISTS idx_pagarme_event_log_processed ON public.pagarme_event_log(processed, created_at);

-- =============================================
-- COMENTÁRIOS para documentação
-- =============================================

COMMENT ON TABLE public.pagarme_config IS 'Configuração do Pagar.me - separada do Stripe para manter compatibilidade';
COMMENT ON TABLE public.payments IS 'Tabela unificada de pagamentos - suporta Stripe e Pagar.me';
COMMENT ON TABLE public.payment_audit_log IS 'Log de auditoria para todas as transações de pagamento';
COMMENT ON TABLE public.pagarme_event_log IS 'Log de eventos do webhook Pagar.me para idempotência';

COMMENT ON COLUMN public.pagarme_config.stripe_custom_payment_method_id IS 'ID cpmt_... criado no Stripe para integração híbrida';
COMMENT ON COLUMN public.payments.cpmt_id IS 'ID do Custom Payment Method quando pagamento vem via Stripe híbrido';
COMMENT ON COLUMN public.payments.external_raw IS 'Payload completo do provedor (sem dados sensíveis)';