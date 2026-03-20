-- Phase 6: Monitoring, Caching & Performance
-- 6.1: Campaign-level metrics cache table
-- 6.3: Per-user Meta API rate limit tracking

-- ── 6.1 Campaign Metrics Cache ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS campaign_metrics_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  ad_account_id TEXT,
  metrics JSONB NOT NULL DEFAULT '{}',
  date_preset TEXT NOT NULL DEFAULT 'last_7d',
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '15 minutes'),
  UNIQUE(campaign_id, date_preset)
);

CREATE INDEX IF NOT EXISTS idx_cmc_user_expires
  ON campaign_metrics_cache (user_id, expires_at DESC);

CREATE INDEX IF NOT EXISTS idx_cmc_campaign
  ON campaign_metrics_cache (campaign_id);

ALTER TABLE campaign_metrics_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own campaign metrics cache"
  ON campaign_metrics_cache FOR SELECT
  USING (user_id = auth.uid());

-- Service role bypasses RLS, so no explicit policy needed for writes.
-- INSERT/UPDATE/DELETE are only done via edge functions using service_role_key.

COMMENT ON TABLE campaign_metrics_cache IS 'Server-side cache for individual campaign metrics from Meta API';

-- ── 6.3 Per-User Meta API Rate Limit Tracking ──────────────────────────────

CREATE TABLE IF NOT EXISTS meta_api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hour_bucket TIMESTAMPTZ NOT NULL,
  call_count INTEGER NOT NULL DEFAULT 1,
  endpoints JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, hour_bucket)
);

CREATE INDEX IF NOT EXISTS idx_meta_api_usage_user_hour
  ON meta_api_usage (user_id, hour_bucket DESC);

ALTER TABLE meta_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own API usage"
  ON meta_api_usage FOR SELECT
  USING (user_id = auth.uid());

-- Service role bypasses RLS for writes (edge functions use service_role_key).

-- ── 6.2 Performance Alerts Table ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS performance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id TEXT,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'warning',
  title TEXT NOT NULL,
  description TEXT,
  metric_name TEXT,
  metric_value NUMERIC,
  threshold_value NUMERIC,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_perf_alerts_user_unread
  ON performance_alerts (user_id, created_at DESC)
  WHERE is_read = false;

ALTER TABLE performance_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts"
  ON performance_alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own alerts"
  ON performance_alerts FOR UPDATE
  USING (user_id = auth.uid());

-- Service role bypasses RLS for inserts (edge functions use service_role_key).

COMMENT ON TABLE performance_alerts IS 'AI-generated performance alerts for campaign anomalies';
