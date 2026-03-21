// Phase 7.2 — Edge function log persistence
// Called by other edge functions to persist error/warn logs to DB
// Also serves as admin API to query logs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { corsHeadersFor, handlePreflight } from '../_shared/cors.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
);

serve(async (req) => {
  const origin = req.headers.get('Origin');
  const headers = corsHeadersFor(origin);

  if (req.method === 'OPTIONS') {
    return handlePreflight(req);
  }

  try {
    const body = await req.json();
    const { action } = body;

    // ── Write log entry (called by edge functions via service_role) ──
    if (action === 'write') {
      const {
        function_name,
        level = 'error',
        stage = 'unknown',
        message,
        error_code,
        user_id,
        request_method,
        status_code,
        details,
        duration_ms,
      } = body;

      if (!function_name || !message) {
        return new Response(
          JSON.stringify({ error: 'function_name and message are required' }),
          { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      const { error: insertErr } = await supabase
        .from('edge_function_logs')
        .insert({
          function_name,
          level,
          stage,
          message,
          error_code: error_code || null,
          user_id: user_id || null,
          request_method: request_method || null,
          status_code: status_code || null,
          details: details || {},
          duration_ms: duration_ms || null,
        });

      if (insertErr) {
        console.error('[edge-log-persist] Insert failed:', insertErr.message);
        return new Response(
          JSON.stringify({ success: false, error: insertErr.message }),
          { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    // ── Read logs (admin only) ──
    if (action === 'list') {
      // Verify admin via auth header
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Auth required' }),
          { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      const isAdmin = user.user_metadata?.role === 'admin' || user.user_metadata?.is_admin === true;
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      // Query params
      const {
        function_name: filterFn,
        level: filterLevel,
        limit = 100,
        offset = 0,
      } = body;

      let query = supabase
        .from('edge_function_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (filterFn) query = query.eq('function_name', filterFn);
      if (filterLevel) query = query.eq('level', filterLevel);

      const { data: logs, count, error: queryErr } = await query;

      if (queryErr) {
        return new Response(
          JSON.stringify({ success: false, error: queryErr.message }),
          { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, data: logs || [], total: count || 0 }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    // ── Stats summary (admin only) ──
    if (action === 'stats') {
      const authHeader = req.headers.get('Authorization');
      if (!authHeader) {
        return new Response(
          JSON.stringify({ error: 'Auth required' }),
          { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
      if (authErr || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid token' }),
          { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      const isAdmin = user.user_metadata?.role === 'admin' || user.user_metadata?.is_admin === true;
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Admin access required' }),
          { status: 403, headers: { ...headers, 'Content-Type': 'application/json' } }
        );
      }

      // Count errors in last 24h grouped by function
      const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const { data: recentErrors } = await supabase
        .from('edge_function_logs')
        .select('function_name, level')
        .gte('created_at', since24h);

      // Aggregate by function
      const byFunction: Record<string, { errors: number; warnings: number; total: number }> = {};
      let totalErrors = 0;
      let totalWarnings = 0;

      for (const row of recentErrors || []) {
        if (!byFunction[row.function_name]) {
          byFunction[row.function_name] = { errors: 0, warnings: 0, total: 0 };
        }
        byFunction[row.function_name].total++;
        if (row.level === 'error') {
          byFunction[row.function_name].errors++;
          totalErrors++;
        }
        if (row.level === 'warn') {
          byFunction[row.function_name].warnings++;
          totalWarnings++;
        }
      }

      // Sort by error count descending
      const topFunctions = Object.entries(byFunction)
        .sort(([, a], [, b]) => b.errors - a.errors)
        .slice(0, 20)
        .map(([name, counts]) => ({ function_name: name, ...counts }));

      return new Response(
        JSON.stringify({
          success: true,
          data: {
            total_errors_24h: totalErrors,
            total_warnings_24h: totalWarnings,
            total_logs_24h: (recentErrors || []).length,
            top_functions: topFunctions,
          },
        }),
        { status: 200, headers: { ...headers, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: write, list, stats' }),
      { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    console.error('[edge-log-persist] Unhandled error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
    );
  }
});
