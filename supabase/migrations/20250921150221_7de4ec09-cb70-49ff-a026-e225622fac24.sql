-- Add must_change_password field to profiles table for password reset security
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

-- Create stripe_event_log table for webhook idempotency
CREATE TABLE IF NOT EXISTS public.stripe_event_log(
  id text PRIMARY KEY,
  received_at timestamptz DEFAULT now()
);

-- Enable RLS on stripe_event_log
ALTER TABLE public.stripe_event_log ENABLE ROW LEVEL SECURITY;

-- Create policy for stripe_event_log (service role only)
CREATE POLICY "service_role_access_stripe_event_log" ON public.stripe_event_log
FOR ALL USING (auth.role() = 'service_role');