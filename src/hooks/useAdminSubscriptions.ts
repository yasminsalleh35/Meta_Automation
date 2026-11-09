import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sanitizeSearchTerm, ADMIN_PAGE_SIZE } from '@/lib/postgrestSearch';

export interface AdminSubscriptionRow {
  source: 'subscribers' | 'pagarme_subscriptions';
  id: string;
  provider: string;
  user_id: string | null;
  email: string | null;
  name: string | null;
  plan_label: string;
  status: string;
  is_current: boolean;
  monthly_amount: number;
  current_period_end: string | null;
  canceled_at: string | null;
  external_id: string | null;
  environment: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface AdminSubscriptionFilters {
  search?: string;
  provider?: string; // stripe | asaas | pagarme
  status?: string; // current | not_current | active | canceled | ...
  includeTest?: boolean;
}

// Audit ADM-03: a lista de assinaturas vinha de subscribers.plan_type (todos os perfis numa chamada,
// sem Pagar.me). admin_list_subscriptions() une subscribers + pagarme_subscriptions, filtra e pagina
// no servidor e devolve o total (total_count) junto com as linhas.
export const useAdminSubscriptions = (pageSize: number = ADMIN_PAGE_SIZE) => {
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef<AdminSubscriptionFilters>({});
  const requestRef = useRef(0);

  const loadSubscriptions = useCallback(async (filters?: AdminSubscriptionFilters, nextPage: number = 0) => {
    if (filters !== undefined) filtersRef.current = filters;
    const active = filtersRef.current;
    const requestId = ++requestRef.current;
    const p = Math.max(0, Math.floor(nextPage) || 0);
    try {
      setIsLoading(true);
      setError(null);
      const { data, error } = await supabase.rpc('admin_list_subscriptions', {
        // undefined omite o parâmetro → default null da função
        p_search: sanitizeSearchTerm(active.search) || undefined,
        p_provider: active.provider || undefined,
        p_status: active.status || undefined,
        p_limit: pageSize,
        p_offset: p * pageSize,
        p_include_test: !!active.includeTest,
      });
      if (error) throw error;
      if (requestId !== requestRef.current) return; // resposta de um filtro antigo
      const list = (data || []).map((r) => ({ ...r, monthly_amount: Number(r.monthly_amount) || 0 }));
      setRows(list as AdminSubscriptionRow[]);
      setTotalCount(list.length > 0 ? Number(list[0].total_count) || 0 : 0);
      setPage(p);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      console.error('Error loading admin subscriptions:', err);
      const msg = (err as { message?: string })?.message;
      setError(msg === 'forbidden' ? 'Você não tem permissão para ver as assinaturas.' : msg || 'Erro ao carregar assinaturas');
      setRows([]);
      setTotalCount(0);
    } finally {
      if (requestId === requestRef.current) setIsLoading(false);
    }
  }, [pageSize]);

  return {
    rows,
    totalCount,
    page,
    pageSize,
    goToPage: (p: number) => loadSubscriptions(undefined, p),
    loadSubscriptions,
    isLoading,
    error,
  };
};
