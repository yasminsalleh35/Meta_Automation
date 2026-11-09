import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { buildIlikeOrFilter, pageRange, ADMIN_PAGE_SIZE } from '@/lib/postgrestSearch';

export interface AdminClientCampaign {
  id: string;
  user_id: string;
  name: string;
  objective: string | null;
  status: string | null;
  budget_total: number | null;
  budget_daily: number | null;
  location_city: string | null;
  location_state: string | null;
  meta_campaign_id: string | null;
  created_at: string;
}

export interface AdminCampaignStats {
  total: number;
  byStatus: Record<string, number>;
  totalBudget: number;
  avgBudget: number;
  integrated: number;
}

const STATUS_OPTIONS = new Set(['active', 'paused', 'draft', 'finished']);

// ADM-03: a página "Campanhas dos Clientes" usava useRealCampaigns (filtra pelo usuário logado →
// o admin via só as próprias). Aqui: todas as campanhas (policy "Admins can view all campaigns"),
// paginadas no servidor, com busca saneada e estatísticas via admin_campaign_stats().
export const useAdminClientCampaigns = (pageSize: number = ADMIN_PAGE_SIZE) => {
  const [campaigns, setCampaigns] = useState<AdminClientCampaign[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<AdminCampaignStats>({ total: 0, byStatus: {}, totalBudget: 0, avgBudget: 0, integrated: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef<{ status?: string; search?: string }>({});

  const loadCampaigns = useCallback(async (filters?: { status?: string; search?: string }, nextPage: number = 0) => {
    if (filters !== undefined) filtersRef.current = filters;
    const active = filtersRef.current;
    try {
      setIsLoading(true);
      setError(null);
      const [from, to] = pageRange(nextPage, pageSize);
      let query = supabase
        .from('campaigns')
        .select('id,user_id,name,objective,status,budget_total,budget_daily,location_city,location_state,meta_campaign_id,created_at', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (active.status && STATUS_OPTIONS.has(active.status)) {
        query = query.ilike('status', active.status);
      }
      const searchFilter = buildIlikeOrFilter(['name'], active.search);
      if (searchFilter) query = query.or(searchFilter);

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      setCampaigns((data || []) as AdminClientCampaign[]);
      setTotalCount(count ?? 0);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading admin campaigns:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar campanhas');
    } finally {
      setIsLoading(false);
    }
  }, [pageSize]);

  const loadStats = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_campaign_stats');
    if (error) {
      console.error('Error loading campaign stats:', error);
      return;
    }
    const s = (data || {}) as Record<string, unknown>;
    setStats({
      total: Number(s.total) || 0,
      byStatus: (s.by_status as Record<string, number>) || {},
      totalBudget: Number(s.total_budget) || 0,
      avgBudget: Number(s.avg_budget) || 0,
      integrated: Number(s.integrated) || 0,
    });
  }, []);

  // A lista é carregada pela página (loadCampaigns com os filtros); aqui só as estatísticas.
  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    campaigns,
    totalCount,
    page,
    pageSize,
    goToPage: (p: number) => loadCampaigns(undefined, p),
    loadCampaigns,
    stats,
    isLoading,
    error,
  };
};
