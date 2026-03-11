-- =============================================
-- PAGAR.ME MIGRATION - Adicionar campos para suporte completo
-- Adiciona suporte a planos, assinaturas e recorrência via Pagar.me
-- =============================================

-- 1. Adicionar campos Pagar.me na subscription_plans
ALTER TABLE public.subscription_plans 
ADD COLUMN IF NOT EXISTS pagarme_plan_id text,
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS deprecated boolean DEFAULT false;

-- 2. Adicionar campos Pagar.me na subscribers para assinaturas
ALTER TABLE public.subscribers 
ADD COLUMN IF NOT EXISTS provider text DEFAULT 'stripe',
ADD COLUMN IF NOT EXISTS pagarme_subscription_id text,
ADD COLUMN IF NOT EXISTS current_period_end timestamptz,
ADD COLUMN IF NOT EXISTS canceled_at timestamptz,
ADD COLUMN IF NOT EXISTS pagarme_customer_id text;

-- 3. Adicionar campos de recorrência na pagarme_config
ALTER TABLE public.pagarme_config
ADD COLUMN IF NOT EXISTS subscription_mode text DEFAULT 'prepaid',
ADD COLUMN IF NOT EXISTS charge_day integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS trial_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS billing_grace_days integer DEFAULT 5,
ADD COLUMN IF NOT EXISTS webhook_basic_user text,
ADD COLUMN IF NOT EXISTS webhook_basic_password text,
ADD COLUMN IF NOT EXISTS api_version text DEFAULT '1';

-- 4. Tabela para audit de configurações Pagar.me (se não existir)
CREATE TABLE IF NOT EXISTS public.pagarme_config_audit (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  config_id uuid,
  user_id uuid,
  action text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pagarme_config_audit ENABLE ROW LEVEL SECURITY;

-- 5. Tabela para feature flags/configurações globais  
CREATE TABLE IF NOT EXISTS public.payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- 6. Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_payment_settings_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_payment_settings_updated_at
BEFORE UPDATE ON public.payment_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_payment_settings_updated_at();

-- 7. RLS Policies

-- pagarme_config_audit: apenas super admins
CREATE POLICY "super_admin_read_pagarme_config_audit" ON public.pagarme_config_audit
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'::app_role
  )
);

CREATE POLICY "system_insert_pagarme_config_audit" ON public.pagarme_config_audit
FOR INSERT WITH CHECK (true);

-- payment_settings: apenas admins
CREATE POLICY "admin_full_access_payment_settings" ON public.payment_settings
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin'::app_role, 'super_admin'::app_role)
  )
);

-- 8. Função para upsert payment settings
CREATE OR REPLACE FUNCTION public.upsert_payment_setting(
  p_setting_key text,
  p_setting_value jsonb,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  setting_id uuid;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin'::app_role, 'super_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Upsert the setting
  INSERT INTO public.payment_settings (setting_key, setting_value, description)
  VALUES (p_setting_key, p_setting_value, p_description)
  ON CONFLICT (setting_key) 
  DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    description = COALESCE(EXCLUDED.description, payment_settings.description),
    updated_at = now()
  RETURNING id INTO setting_id;
  
  RETURN setting_id;
END;
$$;

-- 9. Função para buscar setting
CREATE OR REPLACE FUNCTION public.get_payment_setting(p_setting_key text)
RETURNS TABLE(setting_value jsonb, updated_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT setting_value, updated_at
  FROM public.payment_settings
  WHERE setting_key = p_setting_key;
$$;

-- 10. Inserir feature flag padrão
INSERT INTO public.payment_settings (setting_key, setting_value, description)
VALUES (
  'enable_pagarme_only',
  '{"enabled": false, "rollout_percentage": 0}'::jsonb,
  'Feature flag para habilitar Pagar.me como provedor único'
) ON CONFLICT (setting_key) DO NOTHING;

-- 11. Função para sync de planos Pagar.me (preparação)
CREATE OR REPLACE FUNCTION public.sync_pagarme_plan(
  p_plan_type text,
  p_pagarme_plan_id text
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin'::app_role, 'super_admin'::app_role)
  ) THEN
    RAISE EXCEPTION 'Access denied. Admin role required.';
  END IF;

  -- Update plan with Pagar.me ID
  UPDATE public.subscription_plans 
  SET 
    pagarme_plan_id = p_pagarme_plan_id,
    provider = 'pagarme',
    updated_at = now()
  WHERE plan_type = p_plan_type;
  
  RETURN FOUND;
END;
$$;