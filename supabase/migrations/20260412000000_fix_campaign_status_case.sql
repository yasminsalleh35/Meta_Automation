-- Fix campaign status case: lowercase normalization
-- Some records may have been inserted with uppercase values (e.g. 'PAUSED', 'ACTIVE')
-- which breaks the CHECK constraint and causes activeCampaigns count to show 0.
-- Normalize all status values to lowercase to match the constraint.

UPDATE public.campaigns
SET status = LOWER(status)
WHERE status IS NOT NULL
  AND status <> LOWER(status);
