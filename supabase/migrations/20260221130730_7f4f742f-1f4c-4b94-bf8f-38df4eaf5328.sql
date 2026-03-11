
-- A) Campos novos em campaigns (todos com DEFAULT para segurança de schema)
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'camply',
  ADD COLUMN IF NOT EXISTS meta_updated_time timestamptz NULL,
  ADD COLUMN IF NOT EXISTS last_discovered_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS last_status_sync_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS is_deleted_on_meta boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS metrics_window text NOT NULL DEFAULT 'last_30d';

-- B) Constraint UNIQUE para idempotência do upsert (apenas onde meta_campaign_id existe)
CREATE UNIQUE INDEX IF NOT EXISTS uq_campaigns_user_meta_campaign
  ON public.campaigns (user_id, meta_campaign_id)
  WHERE meta_campaign_id IS NOT NULL;

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_campaigns_user_account_status
  ON public.campaigns (user_id, ad_account_id, status);

CREATE INDEX IF NOT EXISTS idx_campaigns_meta_campaign_id
  ON public.campaigns (meta_campaign_id);

CREATE INDEX IF NOT EXISTS idx_campaigns_needs_immediate_sync
  ON public.campaigns (needs_immediate_sync)
  WHERE needs_immediate_sync = true;

-- C) Tabela de circuit breaker persistente
CREATE TABLE IF NOT EXISTS public.meta_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id text NOT NULL UNIQUE,
  blocked_until timestamptz NULL,
  last_error_code text NULL,
  last_error_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.meta_rate_limits ENABLE ROW LEVEL SECURITY;

-- Apenas service role acessa (edge functions usam service role key)
CREATE POLICY "service_role_only_meta_rate_limits"
  ON public.meta_rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- D) Trigger updated_at para meta_rate_limits
CREATE TRIGGER meta_rate_limits_updated_at
  BEFORE UPDATE ON public.meta_rate_limits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
