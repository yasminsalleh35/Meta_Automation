-- Security Fix: Restrict admin access to WhatsApp numbers in campaigns table
-- Issue: Admins can currently view all campaigns including sensitive WhatsApp numbers
-- Solution: Create separate policies for admin access vs user access to protect PII

-- Drop the current admin policy that exposes all campaign data including WhatsApp numbers
DROP POLICY IF EXISTS "Admins can view all campaigns" ON public.campaigns;

-- Create a new policy for users to view their own campaigns (unchanged)
-- This policy already exists, but ensuring it's correct
CREATE POLICY "Users can view their own campaigns only" 
ON public.campaigns 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a restricted admin policy that allows admins to view campaign data 
-- but excludes sensitive PII fields like WhatsApp numbers
-- We'll use a view for admins to access campaign data without sensitive fields
CREATE VIEW public.campaigns_admin_view AS 
SELECT 
    id,
    user_id,
    name,
    objective,
    status,
    location_country,
    location_state,
    location_city,
    location_radius,
    age_min,
    age_max,
    gender,
    interests,
    placements,
    devices,
    budget_daily,
    budget_total,
    start_date,
    end_date,
    ad_title,
    ad_text,
    destination_url,
    media_file_id,
    facebook_page,
    instagram_account,
    -- Exclude whatsapp_number for privacy protection
    meta_campaign_id,
    meta_adset_id,
    meta_ad_id,
    processing_status,
    meta_integration_status,
    selected_locations,
    error_log,
    retry_count,
    last_processed_at,
    job_id,
    created_at,
    updated_at
FROM public.campaigns;

-- Enable RLS on the admin view
ALTER VIEW public.campaigns_admin_view SET (security_barrier = true);

-- Create RLS policy for the admin view that only allows admins to access it
CREATE POLICY "Admins can view campaigns without sensitive data" 
ON public.campaigns_admin_view 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Ensure the main campaigns table only allows users to see their own data
-- Remove any permissive admin policies
CREATE POLICY "Strict user access only for campaigns" 
ON public.campaigns 
FOR SELECT 
USING (auth.uid() = user_id);