-- Optional: Add audit logging for integration access (if desired)
CREATE TABLE IF NOT EXISTS public.integration_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  integration_id UUID NOT NULL REFERENCES public.integrations(id),
  action TEXT NOT NULL CHECK (action IN ('VIEW', 'UPDATE', 'DELETE')),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.integration_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view integration access logs" 
ON public.integration_access_log FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Users can insert their own access logs (for audit trail)
CREATE POLICY "Log integration access" 
ON public.integration_access_log FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Optional: Add token expiration monitoring
ALTER TABLE public.integrations 
ADD COLUMN IF NOT EXISTS last_token_refresh TIMESTAMP WITH TIME ZONE DEFAULT now(),
ADD COLUMN IF NOT EXISTS token_refresh_count INTEGER DEFAULT 0;