-- Fix subscribers table RLS policies to prevent email-based access vulnerability
-- This removes the email-based access that could allow users to view subscription data
-- if they know someone's email address

-- Drop the existing vulnerable policy
DROP POLICY IF EXISTS "select_own_subscription" ON public.subscribers;

-- Create new secure policy that only allows user_id based access
CREATE POLICY "select_own_subscription" ON public.subscribers
FOR SELECT
USING (user_id = auth.uid());

-- Also fix the update policy to be more restrictive
DROP POLICY IF EXISTS "update_own_subscription" ON public.subscribers;

CREATE POLICY "update_own_subscription" ON public.subscribers
FOR UPDATE
USING (user_id = auth.uid());

-- Fix the insert policy to ensure proper user_id matching
DROP POLICY IF EXISTS "insert_subscription" ON public.subscribers;

CREATE POLICY "insert_subscription" ON public.subscribers
FOR INSERT
WITH CHECK (user_id = auth.uid());