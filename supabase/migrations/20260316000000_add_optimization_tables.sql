-- Phase 3: AI-Driven Optimization tables
-- optimization_suggestions: stores AI-generated optimization suggestions per campaign
-- optimization_logs: audit trail of applied optimizations

-- Suggestions table
CREATE TABLE IF NOT EXISTS public.optimization_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  campaign_id uuid NOT NULL,
  meta_campaign_id text NOT NULL,
  type text NOT NULL CHECK (type IN (
    'increase_budget', 'decrease_budget',
    'pause_campaign', 'activate_campaign',
    'adjust_targeting', 'duplicate_campaign',
    'update_creative', 'general'
  )),
  title text NOT NULL,
  description text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'success', 'warning', 'danger')),
  metrics_snapshot jsonb NOT NULL DEFAULT '{}',
  suggested_action jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed', 'expired')),
  ai_model text,
  ai_provider text,
  created_at timestamptz NOT NULL DEFAULT now(),
  applied_at timestamptz,
  dismissed_at timestamptz,
  expires_at timestamptz DEFAULT (now() + interval '7 days')
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_opt_suggestions_user_status
  ON public.optimization_suggestions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_opt_suggestions_campaign
  ON public.optimization_suggestions(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_opt_suggestions_expires
  ON public.optimization_suggestions(expires_at) WHERE status = 'pending';

-- RLS policies
ALTER TABLE public.optimization_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own suggestions"
  ON public.optimization_suggestions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert suggestions"
  ON public.optimization_suggestions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update own suggestions"
  ON public.optimization_suggestions FOR UPDATE
  USING (auth.uid() = user_id);

-- Logs table (audit trail)
CREATE TABLE IF NOT EXISTS public.optimization_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_id uuid REFERENCES public.optimization_suggestions(id) ON DELETE SET NULL,
  campaign_id uuid NOT NULL,
  meta_campaign_id text NOT NULL,
  action_type text NOT NULL,
  action_payload jsonb NOT NULL DEFAULT '{}',
  before_state jsonb NOT NULL DEFAULT '{}',
  after_state jsonb NOT NULL DEFAULT '{}',
  success boolean NOT NULL DEFAULT true,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_opt_logs_user
  ON public.optimization_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_opt_logs_campaign
  ON public.optimization_logs(campaign_id, created_at DESC);

ALTER TABLE public.optimization_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON public.optimization_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert logs"
  ON public.optimization_logs FOR INSERT
  WITH CHECK (true);
