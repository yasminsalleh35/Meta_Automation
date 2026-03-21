// Phase 7.2 — Fire-and-forget log persistence
// Edge functions call this to persist error/warn logs to the DB
// Uses direct Supabase insert (service_role) — no edge function call overhead

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

export interface PersistLogParams {
  function_name: string;
  level: 'info' | 'warn' | 'error';
  stage: string;
  message: string;
  error_code?: string;
  user_id?: string;
  request_method?: string;
  status_code?: number;
  details?: Record<string, unknown>;
  duration_ms?: number;
}

/**
 * Persists a log entry to edge_function_logs table.
 * Fire-and-forget: never throws, never blocks the response.
 */
export function persistLog(params: PersistLogParams): void {
  // Don't await — fire and forget so it doesn't slow down the response
  supabase
    .from('edge_function_logs')
    .insert({
      function_name: params.function_name,
      level: params.level,
      stage: params.stage,
      message: params.message,
      error_code: params.error_code || null,
      user_id: params.user_id || null,
      request_method: params.request_method || null,
      status_code: params.status_code || null,
      details: params.details || {},
      duration_ms: params.duration_ms || null,
    })
    .then(({ error }) => {
      if (error) {
        console.warn('[logPersist] Failed to persist log:', error.message);
      }
    })
    .catch((err) => {
      console.warn('[logPersist] Unexpected error:', err instanceof Error ? err.message : String(err));
    });
}

/**
 * Creates a logger that both console-logs AND persists errors/warnings to DB.
 * Use this as a drop-in replacement for createLogger when DB persistence is needed.
 */
export function createPersistentLogger(functionName: string) {
  const startTime = Date.now();
  let userId: string | undefined;

  function setUserId(id: string) {
    userId = id;
  }

  function log(
    level: 'info' | 'warn' | 'error',
    stage: string,
    message: string,
    data?: Record<string, unknown>
  ) {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}][${functionName}][${stage.toUpperCase()}]`;
    const elapsed = Date.now() - startTime;

    // Always console-log
    switch (level) {
      case 'error':
        console.error(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
        break;
      default:
        console.log(`${prefix} ${message}`, data ? JSON.stringify(data) : '');
    }

    // Persist errors and warnings to DB (fire-and-forget)
    if (level === 'error' || level === 'warn') {
      persistLog({
        function_name: functionName,
        level,
        stage,
        message,
        user_id: userId,
        details: data,
        duration_ms: elapsed,
      });
    }
  }

  return {
    setUserId,
    info: (stage: string, message: string, data?: Record<string, unknown>) =>
      log('info', stage, message, data),
    warn: (stage: string, message: string, data?: Record<string, unknown>) =>
      log('warn', stage, message, data),
    error: (stage: string, message: string, data?: Record<string, unknown>) =>
      log('error', stage, message, data),
    elapsed: () => Date.now() - startTime,
  };
}
