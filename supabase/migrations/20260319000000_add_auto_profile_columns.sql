-- Add columns to support auto-generated AI profiles per user
ALTER TABLE public.campaign_profiles
ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_auto_generated BOOLEAN NOT NULL DEFAULT false;

-- Index for fast lookup of user's auto-generated profile
CREATE INDEX IF NOT EXISTS idx_campaign_profiles_owner_auto
ON public.campaign_profiles (owner_user_id, is_auto_generated)
WHERE is_auto_generated = true;

-- RLS: allow users to read their own auto-generated profiles
CREATE POLICY "Users can view their own auto-generated profiles"
ON public.campaign_profiles
FOR SELECT
USING (
  owner_user_id = auth.uid()
  OR owner_user_id IS NULL
);
