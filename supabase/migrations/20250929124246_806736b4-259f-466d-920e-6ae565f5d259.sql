-- SECURITY FIX 1: Strengthen RLS policies for leads table
DROP POLICY IF EXISTS "Allow lead creation with proper user assignment" ON public.leads;

CREATE POLICY "Secure lead creation" ON public.leads
FOR INSERT 
WITH CHECK (
  -- Allow unauthenticated users to create leads (for landing page forms)
  (auth.uid() IS NULL AND user_id IS NULL AND owner_id IS NULL) OR
  -- Allow authenticated users to create their own leads
  (auth.uid() IS NOT NULL AND auth.uid() = user_id) OR
  -- Allow admins to create leads for any user
  (EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() 
    AND ur.role IN ('admin', 'super_admin')
  ))
);

-- SECURITY FIX 2: Add data retention function for GDPR compliance
CREATE OR REPLACE FUNCTION public.anonymize_old_leads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.leads 
  SET 
    name = 'ANONYMIZED',
    email = NULL,
    whatsapp_e164 = NULL,
    notes = 'Data anonymized due to retention policy',
    status = 'archived'
  WHERE created_at < NOW() - INTERVAL '2 years'
    AND status NOT IN ('archived', 'anonymized');
END;
$$;

-- SECURITY FIX 3: Add rate limiting table for DoS protection
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  ip_address inet,
  operation_type text NOT NULL,
  attempt_count integer DEFAULT 1,
  window_start timestamp with time zone DEFAULT NOW(),
  created_at timestamp with time zone DEFAULT NOW(),
  UNIQUE(user_id, operation_type, window_start)
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own rate limits" ON public.rate_limits
FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- SECURITY FIX 4: Rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  operation_type_param text,
  max_attempts integer DEFAULT 10,
  window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_attempts integer;
  user_uuid uuid;
  client_ip inet;
BEGIN
  user_uuid := auth.uid();
  client_ip := inet_client_addr();
  
  -- Count attempts in current window
  SELECT COALESCE(SUM(attempt_count), 0) INTO current_attempts
  FROM public.rate_limits
  WHERE operation_type = operation_type_param
    AND (user_id = user_uuid OR (user_uuid IS NULL AND ip_address = client_ip))
    AND window_start > NOW() - (window_minutes || ' minutes')::interval;
  
  -- If under limit, log attempt and allow
  IF current_attempts < max_attempts THEN
    INSERT INTO public.rate_limits (user_id, ip_address, operation_type)
    VALUES (user_uuid, client_ip, operation_type_param)
    ON CONFLICT (user_id, operation_type, window_start)
    DO UPDATE SET attempt_count = rate_limits.attempt_count + 1;
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;