-- CAMPANHAS: colunas de cache e métricas
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS status_at_sync TEXT,
  ADD COLUMN IF NOT EXISTS last_metrics_sync_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metrics JSONB,
  ADD COLUMN IF NOT EXISTS needs_immediate_sync BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_campaigns_status_lastsync
  ON public.campaigns(status, last_metrics_sync_at DESC);

-- FILA DE SYNC (apenas campanhas ativas ou ações pontuais)
CREATE TABLE IF NOT EXISTS public.campaign_sync_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  meta_campaign_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('metrics','status','discovery')),
  created_at TIMESTAMPTZ DEFAULT now(),
  visible_at TIMESTAMPTZ DEFAULT now(),
  attempts INT DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_sync_queue_visible ON public.campaign_sync_queue(visible_at);

-- RLS para campaign_sync_queue
ALTER TABLE public.campaign_sync_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync queue" 
  ON public.campaign_sync_queue 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync queue" 
  ON public.campaign_sync_queue 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update sync queue" 
  ON public.campaign_sync_queue 
  FOR UPDATE 
  USING (true);

CREATE POLICY "System can delete from sync queue" 
  ON public.campaign_sync_queue 
  FOR DELETE 
  USING (true);