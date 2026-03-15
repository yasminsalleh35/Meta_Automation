-- Add cascade status tracking columns to campaigns table
-- These track the effective_status of ad sets and ads when cascade activate/pause is used

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS meta_adset_status text NULL,
  ADD COLUMN IF NOT EXISTS meta_ad_status text NULL;

COMMENT ON COLUMN public.campaigns.meta_adset_status
  IS 'Effective status of the Meta Ad Set (ACTIVE, PAUSED, IN_PROCESS, etc.)';
COMMENT ON COLUMN public.campaigns.meta_ad_status
  IS 'Effective status of the Meta Ad (ACTIVE, PAUSED, IN_PROCESS, etc.)';
