
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from './useSupabase';
import { buildIlikeOrFilter, pageRange, ADMIN_PAGE_SIZE } from '@/lib/postgrestSearch';

export interface BusinessSetting {
  id: string;
  user_id: string;
  business_name: string | null;
  business_description: string | null;
  main_product: string | null;
  category: string | null;
  target_audience: string | null;
  business_goals: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessCategoryCount {
  id: string;
  name: string;
  count: number;
}

export interface BusinessStats {
  totalBusinesses: number;
  totalCategories: number;
  recentBusinesses: number;
  categories: BusinessCategoryCount[];
}

export interface BusinessFilters {
  category?: string;
  search?: string;
}

const EMPTY_STATS: BusinessStats = { totalBusinesses: 0, totalCategories: 0, recentBusinesses: 0, categories: [] };

// ADM-03: lista paginada no servidor (admins leem todas as linhas via policy business_settings_admin_select),
// busca saneada (sem injeção no .or()) e estatísticas agregadas via admin_business_settings_stats().
export const useRealBusinessSettings = (pageSize: number = ADMIN_PAGE_SIZE) => {
  const [businesses, setBusinesses] = useState<BusinessSetting[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<BusinessStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef<BusinessFilters>({});
  const supabase = useSupabase();

  const loadBusinesses = useCallback(async (filters?: BusinessFilters, nextPage: number = 0) => {
    if (filters !== undefined) filtersRef.current = filters;
    const active = filtersRef.current;
    try {
      setIsLoading(true);
      setError(null);
      const [from, to] = pageRange(nextPage, pageSize);
      let query = supabase
        .from('business_settings')
        .select('id,user_id,business_name,business_description,main_product,category,target_audience,business_goals,created_at,updated_at', { count: 'exact' })
        .order('created_at', { ascending: false });

      // "all" = sem filtro de categoria
      if (active.category && active.category !== 'all') {
        query = query.eq('category', active.category);
      }

      const searchFilter = buildIlikeOrFilter(['business_name', 'business_description'], active.search);
      if (searchFilter) {
        query = query.or(searchFilter);
      }

      const { data, error, count } = await query.range(from, to);

      if (error) throw error;
      setBusinesses((data || []) as BusinessSetting[]);
      setTotalCount(count ?? 0);
      setPage(nextPage);
    } catch (err) {
      console.error('Error loading businesses:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar negócios');
    } finally {
      setIsLoading(false);
    }
  }, [supabase, pageSize]);

  const loadStats = useCallback(async () => {
    const { data, error } = await supabase.rpc('admin_business_settings_stats');
    if (error) {
      console.error('Error loading business stats:', error);
      return;
    }
    const s = (data || {}) as { total?: number; recent_7d?: number; categories?: BusinessCategoryCount[] };
    const categories = Array.isArray(s.categories) ? s.categories : [];
    setStats({
      totalBusinesses: Number(s.total) || 0,
      totalCategories: categories.length,
      recentBusinesses: Number(s.recent_7d) || 0,
      categories,
    });
  }, [supabase]);

  const getBusinessStats = () => stats;

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return null;
    return stats.categories.find(c => c.id === categoryId)?.name || categoryId;
  };

  useEffect(() => {
    loadBusinesses({}, 0);
    loadStats();
  }, [loadBusinesses, loadStats]);

  return {
    businesses,
    totalCount,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(totalCount / pageSize)),
    goToPage: (p: number) => loadBusinesses(undefined, p),
    isLoading,
    error,
    loadBusinesses,
    getBusinessStats,
    getCategoryName,
    stats
  };
};
