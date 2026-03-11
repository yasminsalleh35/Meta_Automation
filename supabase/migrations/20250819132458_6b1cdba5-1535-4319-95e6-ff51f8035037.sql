-- CRITICAL SECURITY FIXES - Phase 1: Data Protection (Corrected)
-- Fix 1: Restrict admin access to profiles table (remove email exposure)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.profiles;

-- Fix 2: Secure integrations table (protect access tokens and secrets)
DROP POLICY IF EXISTS "Admins can view all integrations" ON public.integrations;

-- Fix 3: Create secure admin functions instead of views with policies
-- Function for admins to view profiles without sensitive data
CREATE OR REPLACE FUNCTION public.get_profiles_admin_safe()
RETURNS TABLE (
    id UUID,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    last_login_at TIMESTAMP WITH TIME ZONE,
    status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Only allow admins to call this function
  SELECT 
    p.id,
    p.name,
    p.created_at,
    p.updated_at,
    p.last_login_at,
    p.status
  FROM public.profiles p
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  );
$function$;

-- Function for admins to view integrations without credentials
CREATE OR REPLACE FUNCTION public.get_integrations_admin_safe()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    provider TEXT,
    status TEXT,
    ad_account_id TEXT,
    page_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    access_token_status TEXT,
    app_secret_status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  -- Only allow admins to call this function
  SELECT 
    i.id,
    i.user_id,
    i.provider,
    i.status,
    i.ad_account_id,
    i.page_id,
    i.created_at,
    i.updated_at,
    CASE WHEN i.access_token IS NOT NULL THEN '***MASKED***' ELSE NULL END as access_token_status,
    CASE WHEN i.app_secret IS NOT NULL THEN '***MASKED***' ELSE NULL END as app_secret_status
  FROM public.integrations i
  WHERE EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  );
$function$;

-- Fix 4: Update all other database functions with proper search_path
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_campaign_jobs_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.create_campaign_job()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Criar job apenas se a campanha não veio com IDs do Meta (nova campanha)
  IF NEW.meta_campaign_id IS NULL THEN
    INSERT INTO public.campaign_jobs (campaign_id, job_type, status)
    VALUES (NEW.id, 'meta_integration', 'pending');
  END IF;
  
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_code_snapshots_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_notifications_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_sector_categories_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_sector_specializations_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.update_campaign_templates_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;