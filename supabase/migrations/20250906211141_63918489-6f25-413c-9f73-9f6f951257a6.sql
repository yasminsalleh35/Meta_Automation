-- Add new fields to business_settings for dental specialties
ALTER TABLE public.business_settings
  ADD COLUMN IF NOT EXISTS odont_specialties TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS target_age_min INT DEFAULT 18,
  ADD COLUMN IF NOT EXISTS target_age_max INT DEFAULT 65;

-- Create strategy_reports table for storing generated reports
CREATE TABLE IF NOT EXISTS public.strategy_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source TEXT NOT NULL DEFAULT 'my-business',
  title TEXT,
  payload JSONB NOT NULL,
  result JSONB NOT NULL,
  snapshot_html TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on strategy_reports
ALTER TABLE public.strategy_reports ENABLE ROW LEVEL SECURITY;

-- RLS policies for strategy_reports
CREATE POLICY "sr_select_own" ON public.strategy_reports
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "sr_insert_own" ON public.strategy_reports
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "sr_delete_own" ON public.strategy_reports
FOR DELETE USING (user_id = auth.uid());