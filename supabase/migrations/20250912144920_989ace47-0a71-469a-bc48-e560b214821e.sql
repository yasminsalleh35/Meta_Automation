-- Criar tabela subscribers se não existir
CREATE TABLE IF NOT EXISTS public.subscribers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'premium',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_status TEXT DEFAULT 'active',
  is_active BOOLEAN DEFAULT true,
  created_by_admin BOOLEAN DEFAULT false,
  plan_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

-- Drop policies if they exist
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.subscribers;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.subscribers;
DROP POLICY IF EXISTS "Only service role can manage subscriptions" ON public.subscribers;

-- Create policies for subscribers table
CREATE POLICY "Users can view their own subscription" 
ON public.subscribers 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" 
ON public.subscribers 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = auth.uid() 
  AND ur.role IN ('admin', 'super_admin')
));

CREATE POLICY "Only service role can manage subscriptions" 
ON public.subscribers 
FOR ALL 
USING (auth.role() = 'service_role');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_subscribers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop trigger if it exists and create new one
DROP TRIGGER IF EXISTS update_subscribers_updated_at ON public.subscribers;
CREATE TRIGGER update_subscribers_updated_at
BEFORE UPDATE ON public.subscribers
FOR EACH ROW
EXECUTE FUNCTION public.update_subscribers_updated_at();