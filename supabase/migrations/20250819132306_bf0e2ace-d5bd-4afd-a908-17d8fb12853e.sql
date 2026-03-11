-- CRITICAL SECURITY FIXES - Phase 1: Data Protection
-- Fix 1: Restrict admin access to profiles table (remove email exposure)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update user profiles" ON public.profiles;

-- Create secure admin view for profiles without sensitive data
CREATE OR REPLACE VIEW public.profiles_admin_view AS 
SELECT 
    id,
    name,
    created_at,
    updated_at,
    last_login_at,
    status
FROM public.profiles;

-- Enable RLS on the admin view
ALTER VIEW public.profiles_admin_view SET (security_barrier = true);

-- Create RLS policy for the admin view
CREATE POLICY "Admins can view profiles without sensitive data" 
ON public.profiles_admin_view 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Fix 2: Secure integrations table (protect access tokens and secrets)
DROP POLICY IF EXISTS "Admins can view all integrations" ON public.integrations;

-- Create secure admin view for integrations without credentials
CREATE OR REPLACE VIEW public.integrations_admin_view AS 
SELECT 
    id,
    user_id,
    provider,
    status,
    ad_account_id,
    page_id,
    created_at,
    updated_at,
    -- Mask sensitive fields
    CASE WHEN access_token IS NOT NULL THEN '***MASKED***' ELSE NULL END as access_token_status,
    CASE WHEN app_secret IS NOT NULL THEN '***MASKED***' ELSE NULL END as app_secret_status
FROM public.integrations;

-- Enable RLS on the integrations admin view
ALTER VIEW public.integrations_admin_view SET (security_barrier = true);

-- Create RLS policy for the integrations admin view
CREATE POLICY "Admins can view integrations without credentials" 
ON public.integrations_admin_view 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('admin', 'super_admin')
    )
);

-- Fix 3: Fix database functions security - Add proper search_path
-- Update all functions to have secure search_path

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
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

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles
  INSERT INTO public.profiles (id, email, name, email_verified)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'email_verified')::boolean, false)
  );
  
  -- Give default user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$function$;

-- Update is_admin_user function
CREATE OR REPLACE FUNCTION public.is_admin_user()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$function$;

-- Update is_admin_or_super_admin function
CREATE OR REPLACE FUNCTION public.is_admin_or_super_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
  );
$function$;

-- Fix 4: Create audit logging function for admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
    action_type TEXT,
    table_name TEXT,
    record_id TEXT,
    details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO public.admin_audit_log (
        admin_user_id,
        action_type,
        table_name,
        record_id,
        details,
        ip_address,
        user_agent
    ) VALUES (
        auth.uid(),
        action_type,
        table_name,
        record_id,
        details,
        NULL, -- Will be filled by application
        NULL  -- Will be filled by application
    ) RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$function$;

-- Create admin audit log table
CREATE TABLE IF NOT EXISTS public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_user_id UUID NOT NULL,
    action_type TEXT NOT NULL,
    table_name TEXT NOT NULL,
    record_id TEXT NOT NULL,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can view audit logs
CREATE POLICY "Only super admins can view audit logs" 
ON public.admin_audit_log 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role = 'super_admin'
    )
);