-- Fix account_insights_cache UNIQUE constraint
-- Remove duplicates (keep only the most recent)
DELETE FROM public.account_insights_cache a
USING public.account_insights_cache b
WHERE a.id < b.id
  AND a.user_id = b.user_id
  AND a.ad_account_id = b.ad_account_id
  AND a.date_preset = b.date_preset;

-- Add UNIQUE constraint if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'account_insights_cache_user_id_ad_account_id_date_preset_key'
      AND conrelid = 'public.account_insights_cache'::regclass
  ) THEN
    ALTER TABLE public.account_insights_cache
    ADD CONSTRAINT account_insights_cache_user_id_ad_account_id_date_preset_key
    UNIQUE (user_id, ad_account_id, date_preset);
  END IF;
END $$;