-- =============================================
-- Integração Pagar.me Recorrência (Core/v5)
-- Tabelas para gerenciar assinaturas, clientes e webhooks
-- =============================================

-- Configurações por ambiente (test/live)
CREATE TABLE IF NOT EXISTS pagarme_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  active_environment text NOT NULL DEFAULT 'test' CHECK (active_environment IN ('test','live')),
  -- TEST
  test_account_id text,
  test_public_key text,
  test_secret_key text,
  test_encryption_key text,
  test_webhook_secret text,
  test_plan_mensal_id text,
  test_plan_anual_id text,
  -- LIVE
  live_account_id text,
  live_public_key text,
  live_secret_key text,
  live_encryption_key text,
  live_webhook_secret text,
  live_plan_mensal_id text,
  live_plan_anual_id text,
  -- misc
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE pagarme_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can manage settings
CREATE POLICY "Admins can manage pagarme settings"
ON pagarme_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Clientes Pagar.me
CREATE TABLE IF NOT EXISTS pagarme_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  pagarme_customer_id text NOT NULL,
  environment text NOT NULL CHECK (environment IN ('test','live')),
  created_at timestamptz DEFAULT now(),
  UNIQUE (email, environment)
);

ALTER TABLE pagarme_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own pagarme customer"
ON pagarme_customers FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all pagarme customers"
ON pagarme_customers FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Assinaturas
CREATE TABLE IF NOT EXISTS pagarme_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  plan_code text NOT NULL CHECK (plan_code IN ('mensal','anual')),
  pagarme_subscription_id text NOT NULL,
  pagarme_plan_id text NOT NULL,
  status text NOT NULL,
  installments int NOT NULL,
  amount_cents int NOT NULL,
  currency text NOT NULL DEFAULT 'BRL',
  current_period_end timestamptz,
  last_charge_id text,
  last_order_id text,
  environment text NOT NULL CHECK (environment IN ('test','live')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (pagarme_subscription_id, environment)
);

ALTER TABLE pagarme_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own subscriptions"
ON pagarme_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON pagarme_subscriptions FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Eventos de webhook
CREATE TABLE IF NOT EXISTS pagarme_events (
  id bigserial PRIMARY KEY,
  environment text NOT NULL CHECK (environment IN ('test','live')),
  event_type text NOT NULL,
  external_id text,
  raw jsonb NOT NULL,
  received_at timestamptz DEFAULT now()
);

ALTER TABLE pagarme_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view pagarme events"
ON pagarme_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Entitlements (direitos de acesso)
CREATE TABLE IF NOT EXISTS user_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_code text NOT NULL CHECK (plan_code IN ('mensal','anual')),
  source text NOT NULL DEFAULT 'pagarme',
  status text NOT NULL CHECK (status IN ('active','inactive')),
  valid_until timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own entitlements"
ON user_entitlements FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all entitlements"
ON user_entitlements FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_pagarme_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_pagarme_settings_updated_at
BEFORE UPDATE ON pagarme_settings
FOR EACH ROW
EXECUTE FUNCTION update_pagarme_settings_updated_at();

CREATE TRIGGER update_pagarme_subscriptions_updated_at
BEFORE UPDATE ON pagarme_subscriptions
FOR EACH ROW
EXECUTE FUNCTION update_pagarme_settings_updated_at();

CREATE TRIGGER update_user_entitlements_updated_at
BEFORE UPDATE ON user_entitlements
FOR EACH ROW
EXECUTE FUNCTION update_pagarme_settings_updated_at();

-- Função helper para obter configuração ativa
CREATE OR REPLACE FUNCTION get_active_pagarme_config()
RETURNS TABLE (
  environment text,
  account_id text,
  public_key text,
  secret_key text,
  encryption_key text,
  webhook_secret text,
  plan_mensal_id text,
  plan_anual_id text
)
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    active_environment as environment,
    CASE 
      WHEN active_environment = 'test' THEN test_account_id
      ELSE live_account_id
    END as account_id,
    CASE 
      WHEN active_environment = 'test' THEN test_public_key
      ELSE live_public_key
    END as public_key,
    CASE 
      WHEN active_environment = 'test' THEN test_secret_key
      ELSE live_secret_key
    END as secret_key,
    CASE 
      WHEN active_environment = 'test' THEN test_encryption_key
      ELSE live_encryption_key
    END as encryption_key,
    CASE 
      WHEN active_environment = 'test' THEN test_webhook_secret
      ELSE live_webhook_secret
    END as webhook_secret,
    CASE 
      WHEN active_environment = 'test' THEN test_plan_mensal_id
      ELSE live_plan_mensal_id
    END as plan_mensal_id,
    CASE 
      WHEN active_environment = 'test' THEN test_plan_anual_id
      ELSE live_plan_anual_id
    END as plan_anual_id
  FROM pagarme_settings
  ORDER BY created_at DESC
  LIMIT 1;
$$;