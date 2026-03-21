import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

export interface EdgeLogEntry {
  id: string;
  function_name: string;
  level: string;
  stage: string;
  message: string;
  error_code: string | null;
  user_id: string | null;
  request_method: string | null;
  status_code: number | null;
  details: Record<string, unknown>;
  duration_ms: number | null;
  created_at: string;
}

export interface LogStats {
  total_errors_24h: number;
  total_warnings_24h: number;
  total_logs_24h: number;
  top_functions: Array<{
    function_name: string;
    errors: number;
    warnings: number;
    total: number;
  }>;
}

export function useEdgeLogs() {
  const supabase = useSupabase();
  const [logs, setLogs] = useState<EdgeLogEntry[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [filterFn, setFilterFn] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        action: 'list',
        limit: pageSize,
        offset: page * pageSize,
      };
      if (filterFn) payload.function_name = filterFn;
      if (filterLevel) payload.level = filterLevel;

      const { data, error } = await supabase.functions.invoke('edge-log-persist', {
        body: payload,
      });

      if (error) throw error;
      if (data?.success) {
        setLogs(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (err) {
      console.error('[useEdgeLogs] fetchLogs failed:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase, filterFn, filterLevel, page]);

  const fetchStats = useCallback(async () => {
    try {
      const { data, error } = await supabase.functions.invoke('edge-log-persist', {
        body: { action: 'stats' },
      });
      if (error) throw error;
      if (data?.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('[useEdgeLogs] fetchStats failed:', err);
    }
  }, [supabase]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    logs,
    stats,
    total,
    loading,
    filterFn,
    setFilterFn,
    filterLevel,
    setFilterLevel,
    page,
    setPage,
    pageSize,
    refresh: () => { fetchLogs(); fetchStats(); },
  };
}
