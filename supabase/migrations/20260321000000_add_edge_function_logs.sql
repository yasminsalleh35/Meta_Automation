-- Phase 7.2: Edge function error logging table
-- Stores structured logs from edge functions for admin debugging

CREATE TABLE IF NOT EXISTS edge_function_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name text NOT NULL,
  level text NOT NULL DEFAULT 'error',           -- info | warn | error
  stage text NOT NULL DEFAULT 'unknown',
  message text NOT NULL,
  error_code text,                                -- AppError code (VALIDATION_ERROR, META_API_ERROR, etc.)
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  request_method text,
  status_code integer,
  details jsonb DEFAULT '{}',
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index for admin queries (recent errors by function)
CREATE INDEX IF NOT EXISTS idx_efl_function_created
  ON edge_function_logs (function_name, created_at DESC);

-- Index for filtering by level
CREATE INDEX IF NOT EXISTS idx_efl_level_created
  ON edge_function_logs (level, created_at DESC);

-- Index for user-specific debugging
CREATE INDEX IF NOT EXISTS idx_efl_user_created
  ON edge_function_logs (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Auto-cleanup: delete logs older than 30 days (run via pg_cron if available)
-- SELECT cron.schedule('cleanup-edge-logs', '0 3 * * *',
--   $$DELETE FROM edge_function_logs WHERE created_at < now() - interval '30 days'$$
-- );

-- RLS: only service_role writes (edge functions use service_role key)
-- Admin reads via service_role or admin-check function
ALTER TABLE edge_function_logs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated admins to read logs
CREATE POLICY "admins_read_logs" ON edge_function_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM auth.users u
      WHERE u.id = auth.uid()
      AND (u.raw_user_meta_data->>'role' = 'admin' OR u.raw_user_meta_data->>'is_admin' = 'true')
    )
  );
