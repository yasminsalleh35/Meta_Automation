-- Fix foreign key relationship between campaign_contingency and profiles
-- This allows the admin panel to join with profiles table to display user email and name

-- Step 1: Drop the existing foreign key constraint that points to auth.users
ALTER TABLE public.campaign_contingency
DROP CONSTRAINT IF EXISTS campaign_contingency_user_id_fkey;

-- Step 2: Add new foreign key constraint pointing to profiles table
ALTER TABLE public.campaign_contingency
ADD CONSTRAINT campaign_contingency_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Step 3: Add helpful comment for documentation
COMMENT ON CONSTRAINT campaign_contingency_user_id_fkey 
ON public.campaign_contingency 
IS 'Links contingency campaigns to user profiles for admin display with email and name';

-- Create index for better JOIN performance
CREATE INDEX IF NOT EXISTS idx_campaign_contingency_user_id 
ON public.campaign_contingency(user_id);