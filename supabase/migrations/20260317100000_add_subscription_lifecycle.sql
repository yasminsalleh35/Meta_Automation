-- Phase 5: Subscription Lifecycle Management
-- Adds grace period tracking, payment failure counters, and provider fallback support

-- Add lifecycle columns to subscribers table
ALTER TABLE subscribers
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_failure_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_failure_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fallback_provider TEXT DEFAULT NULL;

-- Webhook event audit table for cross-provider tracking
CREATE TABLE IF NOT EXISTS subscription_status_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  reason TEXT,
  event_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_sub_status_log_user
  ON subscription_status_log (user_id, created_at DESC);

-- RLS for subscription_status_log
ALTER TABLE subscription_status_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription logs"
  ON subscription_status_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Service role can insert subscription logs"
  ON subscription_status_log FOR INSERT
  WITH CHECK (true);

COMMENT ON COLUMN subscribers.grace_period_ends_at IS 'End of grace period after payment failure (default 5 days from failure)';
COMMENT ON COLUMN subscribers.payment_failure_count IS 'Consecutive payment failure count';
COMMENT ON COLUMN subscribers.last_payment_failure_at IS 'Timestamp of most recent payment failure';
COMMENT ON COLUMN subscribers.last_synced_at IS 'Last time subscription status was synced with provider';
COMMENT ON COLUMN subscribers.fallback_provider IS 'Alternative provider if primary fails';
