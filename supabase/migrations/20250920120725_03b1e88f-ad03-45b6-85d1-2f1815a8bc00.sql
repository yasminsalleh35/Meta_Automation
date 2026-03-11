-- 001_add_flags_to_campaign_profiles.sql

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaign_profiles' AND column_name = 'show_strategic_reports'
  ) THEN
    ALTER TABLE public.campaign_profiles
      ADD COLUMN show_strategic_reports boolean NOT NULL DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'campaign_profiles' AND column_name = 'show_dental_specialties'
  ) THEN
    ALTER TABLE public.campaign_profiles
      ADD COLUMN show_dental_specialties boolean NOT NULL DEFAULT false;
  END IF;
END$$;