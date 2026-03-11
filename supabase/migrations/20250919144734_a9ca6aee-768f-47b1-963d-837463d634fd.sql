-- CRITICAL SECURITY FIX: Fix leads table RLS policies
-- Current policies allow ANY authenticated user to access ALL leads data
-- This is a severe data breach risk

-- Drop the overly permissive existing policies
DROP POLICY IF EXISTS "leads_select_auth" ON public.leads;
DROP POLICY IF EXISTS "leads_update_auth" ON public.leads;
DROP POLICY IF EXISTS "leads_delete_auth" ON public.leads;
DROP POLICY IF EXISTS "leads_insert_service" ON public.leads;

-- Create secure RLS policies for leads table
-- Only allow users to access their own leads or admins to access all leads
CREATE POLICY "Users can view their own leads or admins can view all"
ON public.leads FOR SELECT
USING (
  -- User can see leads they own
  (auth.uid() = user_id) OR 
  (auth.uid() = owner_id) OR
  -- Admins can see all leads
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  ))
);

CREATE POLICY "Users can update their own leads or admins can update all"
ON public.leads FOR UPDATE
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() = owner_id) OR
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  ))
);

CREATE POLICY "Users can delete their own leads or admins can delete all"
ON public.leads FOR DELETE
USING (
  (auth.uid() = user_id) OR 
  (auth.uid() = owner_id) OR
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  ))
);

-- Keep lead creation open for edge functions (lead capture forms)
-- but ensure user_id is set properly when authenticated
CREATE POLICY "Allow lead creation with proper user assignment"
ON public.leads FOR INSERT
WITH CHECK (
  -- Allow unauthenticated lead creation (for public forms)
  auth.uid() IS NULL OR
  -- If authenticated, user must match the lead's user_id
  auth.uid() = user_id OR
  -- Admins can create leads for any user
  (EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  ))
);

-- SECURITY FIX: Strengthen access to sensitive configuration tables
-- ai_configurations should only be accessible by super_admins
DROP POLICY IF EXISTS "Only super admins can access AI configurations" ON public.ai_configurations;
CREATE POLICY "super_admin_only_ai_config"
ON public.ai_configurations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);

-- SECURITY FIX: Add audit logging table for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only super admins can read audit logs
CREATE POLICY "super_admin_read_audit_log"
ON public.security_audit_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);

-- System can insert audit logs
CREATE POLICY "system_insert_audit_log"
ON public.security_audit_log FOR INSERT
WITH CHECK (true);

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_security_audit(
  p_action text,
  p_table_name text,
  p_record_id uuid DEFAULT NULL,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.security_audit_log (
    user_id, action, table_name, record_id, old_values, new_values
  ) VALUES (
    auth.uid(), p_action, p_table_name, p_record_id, p_old_values, p_new_values
  );
END;
$$;

-- SECURITY FIX: Add trigger to audit sensitive table changes
CREATE OR REPLACE FUNCTION public.audit_sensitive_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log changes to sensitive tables
  IF TG_TABLE_NAME IN ('stripe_config', 'ai_configurations', 'integrations') THEN
    IF TG_OP = 'INSERT' THEN
      PERFORM public.log_security_audit('INSERT', TG_TABLE_NAME, NEW.id, NULL, to_jsonb(NEW));
    ELSIF TG_OP = 'UPDATE' THEN
      PERFORM public.log_security_audit('UPDATE', TG_TABLE_NAME, NEW.id, to_jsonb(OLD), to_jsonb(NEW));
    ELSIF TG_OP = 'DELETE' THEN
      PERFORM public.log_security_audit('DELETE', TG_TABLE_NAME, OLD.id, to_jsonb(OLD), NULL);
    END IF;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Apply audit triggers to sensitive tables
DROP TRIGGER IF EXISTS audit_stripe_config ON public.stripe_config;
CREATE TRIGGER audit_stripe_config
  AFTER INSERT OR UPDATE OR DELETE ON public.stripe_config
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_ai_configurations ON public.ai_configurations;
CREATE TRIGGER audit_ai_configurations
  AFTER INSERT OR UPDATE OR DELETE ON public.ai_configurations
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

DROP TRIGGER IF EXISTS audit_integrations ON public.integrations;
CREATE TRIGGER audit_integrations
  AFTER INSERT OR UPDATE OR DELETE ON public.integrations
  FOR EACH ROW EXECUTE FUNCTION public.audit_sensitive_changes();

-- SECURITY FIX: Ensure user_id fields are properly set on leads
CREATE OR REPLACE FUNCTION public.set_lead_user_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is authenticated and user_id is not set, set it
  IF auth.uid() IS NOT NULL AND NEW.user_id IS NULL THEN
    NEW.user_id = auth.uid();
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply trigger to automatically set user_id on lead creation
DROP TRIGGER IF EXISTS set_lead_user_id_trigger ON public.leads;
CREATE TRIGGER set_lead_user_id_trigger
  BEFORE INSERT ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.set_lead_user_id();