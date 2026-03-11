-- Migration 4: Criar tabela asaas_webhook_events
CREATE TABLE IF NOT EXISTS public.asaas_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  environment text NOT NULL CHECK (environment IN ('sandbox', 'production')),
  event_type text NOT NULL,
  external_id text,
  payload jsonb NOT NULL,
  processed boolean NOT NULL DEFAULT false,
  processed_at timestamptz,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_type ON public.asaas_webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_processed ON public.asaas_webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_asaas_webhook_events_external ON public.asaas_webhook_events(external_id);

-- RLS
ALTER TABLE public.asaas_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view asaas_webhook_events"
  ON public.asaas_webhook_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

COMMENT ON TABLE public.asaas_webhook_events IS 'Log de webhooks recebidos do Asaas';