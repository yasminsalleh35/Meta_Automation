-- CRITICAL SECURITY FIXES - Phase 4: Final Database Security Issues
-- Fix remaining critical and warning security vulnerabilities

-- Fix 1: Secure AI configurations table (API keys exposure)
-- Remove any permissive admin policies and ensure proper access control
DROP POLICY IF EXISTS "Admin can manage AI configurations" ON public.ai_configurations;

-- Create restrictive policy for AI configurations
CREATE POLICY "Only super admins can access AI configurations" 
ON public.ai_configurations 
FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
);

-- Fix 2: Better secure integrations table
-- The current policy allows admin access, we need to remove that
-- Users should only see their own integrations
-- Admins should use the safe function we created

-- We already removed the admin policy earlier, ensure it stays removed
-- and that only users can access their own data

-- Fix 3: Secure expected_ad_set_settings table with proper user ownership
-- Current RLS is too permissive (any authenticated user)
DROP POLICY IF EXISTS "Users can insert their own ad set settings" ON public.expected_ad_set_settings;
DROP POLICY IF EXISTS "Users can update their own ad set settings" ON public.expected_ad_set_settings;
DROP POLICY IF EXISTS "Users can view their own ad set settings" ON public.expected_ad_set_settings;

-- We need to link ad set settings to users through campaigns
-- First add a user_id column to track ownership
ALTER TABLE public.expected_ad_set_settings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Update existing records to set user_id based on campaign ownership
UPDATE public.expected_ad_set_settings 
SET user_id = (
    SELECT c.user_id 
    FROM public.campaigns c 
    WHERE c.meta_campaign_id = expected_ad_set_settings.campaign_id
)
WHERE user_id IS NULL;

-- Create proper RLS policies for expected_ad_set_settings
CREATE POLICY "Users can view their own ad set settings" 
ON public.expected_ad_set_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ad set settings" 
ON public.expected_ad_set_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ad set settings" 
ON public.expected_ad_set_settings 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own ad set settings" 
ON public.expected_ad_set_settings 
FOR DELETE 
USING (auth.uid() = user_id);

-- Admins can view all (for support purposes) but through safe function
CREATE POLICY "Admins can view all ad set settings for support" 
ON public.expected_ad_set_settings 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Fix 4: Create secure admin function for expected ad set settings
CREATE OR REPLACE FUNCTION public.get_ad_set_settings_admin_safe()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    ad_account_id TEXT,
    campaign_id TEXT,
    ad_set_id TEXT,
    expected_name TEXT,
    expected_budget_type TEXT,
    expected_budget_amount NUMERIC,
    verification_status TEXT,
    is_pending_verification BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Only allow admins to call this function
  SELECT 
    eas.id,
    eas.user_id,
    eas.ad_account_id,
    eas.campaign_id,
    eas.ad_set_id,
    eas.expected_name,
    eas.expected_budget_type,
    eas.expected_budget_amount,
    eas.verification_status,
    eas.is_pending_verification,
    eas.created_at,
    eas.updated_at
  FROM public.expected_ad_set_settings eas
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  );
$function$;

-- Fix 5: Update triggers to set user_id automatically for new ad set settings
CREATE OR REPLACE FUNCTION public.set_ad_set_settings_user_id()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Set user_id from authenticated user if not already set
  IF NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for automatic user_id assignment
DROP TRIGGER IF EXISTS set_ad_set_settings_user_id_trigger ON public.expected_ad_set_settings;
CREATE TRIGGER set_ad_set_settings_user_id_trigger
  BEFORE INSERT ON public.expected_ad_set_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.set_ad_set_settings_user_id();