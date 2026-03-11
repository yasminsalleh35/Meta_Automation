-- Create asaas_pending_checkouts table to track checkout flow
CREATE TABLE IF NOT EXISTS public.asaas_pending_checkouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_email TEXT NOT NULL,
  plan_code TEXT NOT NULL CHECK (plan_code IN ('mensal', 'anual')),
  plan_id UUID NOT NULL,
  asaas_checkout_id TEXT,
  asaas_subscription_id TEXT,
  asaas_customer_id TEXT,
  environment TEXT NOT NULL CHECK (environment IN ('sandbox', 'production')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'completed', 'expired', 'canceled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_asaas_pending_checkouts_checkout_id ON public.asaas_pending_checkouts(asaas_checkout_id);
CREATE INDEX IF NOT EXISTS idx_asaas_pending_checkouts_email ON public.asaas_pending_checkouts(user_email);
CREATE INDEX IF NOT EXISTS idx_asaas_pending_checkouts_status ON public.asaas_pending_checkouts(status);

-- Enable RLS
ALTER TABLE public.asaas_pending_checkouts ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all pending checkouts
CREATE POLICY "Admins can manage all pending checkouts"
  ON public.asaas_pending_checkouts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Trigger to update updated_at
CREATE TRIGGER update_asaas_pending_checkouts_updated_at
  BEFORE UPDATE ON public.asaas_pending_checkouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();