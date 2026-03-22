-- Add daily_insights cache columns to campaigns table
-- This avoids hitting Meta API on every page visit for historical charts
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS daily_insights jsonb DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_daily_insights_at timestamptz DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN campaigns.daily_insights IS 'Cached daily breakdown from Meta Insights API (last 7 days)';
COMMENT ON COLUMN campaigns.last_daily_insights_at IS 'When daily insights were last fetched from Meta API';
