-- Phase 4.4: Campaign Scheduling — add time-based scheduling and dayparting
-- Adds start/end time fields and ad_schedule JSONB for Meta API adset_schedule

-- Add scheduling columns to campaigns table
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS schedule_start_time TEXT,      -- e.g. "08:00"
  ADD COLUMN IF NOT EXISTS schedule_end_time TEXT,        -- e.g. "22:00"
  ADD COLUMN IF NOT EXISTS ad_schedule JSONB DEFAULT NULL; -- Meta adset_schedule format

-- Add index for campaigns with active schedules
CREATE INDEX IF NOT EXISTS idx_campaigns_has_schedule
  ON campaigns (user_id)
  WHERE ad_schedule IS NOT NULL;

COMMENT ON COLUMN campaigns.schedule_start_time IS 'Preferred start hour for ad delivery (HH:MM format)';
COMMENT ON COLUMN campaigns.schedule_end_time IS 'Preferred end hour for ad delivery (HH:MM format)';
COMMENT ON COLUMN campaigns.ad_schedule IS 'Meta API adset_schedule format: array of {start_minute, end_minute, days[], timezone_type}';
