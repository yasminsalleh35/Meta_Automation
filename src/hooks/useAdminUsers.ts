import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminActions } from '@/hooks/useAdminActions';
import { AdminDataService } from '@/services/adminDataService';
import { buildIlikeOrFilter, pageRange, ADMIN_PAGE_SIZE } from '@/lib/postgrestSearch';

export interface AdminUserRow {
  id: string;
  email: string | null;
  name: string | null;
  created_at: string;
  last_login_at: string | null;
  status: 'active' | 'suspended' | 'inactive';
  plan: string; // plan_type do subscribers / plan_code do Pagar.me; 'basic' se não houver assinatura ativa
}

export interface AdminUserStats {
  total: number;
  active: number;
  suspended: number;
  activeSubscriptions: number;
}

const STATUS_OPTIONS = new Set(['active', 'suspended', 'inactive']);

// Audit ADM-03: "Gerenciar Usuários" carregava todos os perfis (get_profiles_admin_safe, sem email,
// limitado a 1.000 linhas) + todos os subscribers/campanhas/integrações. Agora: perfis paginados no
// servidor (get_profiles_admin_with_email + .range/count), busca/status no servidor, planos só dos
// usuários da página e estatísticas por contagem no servidor.
export const useAdminUsers = (pageSize: number = ADMIN_PAGE_SIZE) => {
  const { suspendUser: suspendUserAction, activateUser: activateUserAction } = useAdminActions();
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<AdminUserStats>({ total: 0, active: 0, suspended: 0, activeSubscriptions: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const filtersRef = useRef<{ status?: string; search?: string }>({});
  const requestRef = useRef(0);

  const loadPlans = async (ids: string[]): Promise<Record<string, string>> => {
    const plans: Record<string, string> = {};
    if (ids.length === 0) return plans;
    const [subs, pagarme] = await Promise.all([
      supabase.from('subscribers').select('user_id, plan_type, is_active, subscription_status').in('user_id', ids),
      supabase.from('pagarme_subscriptions').select('user_id, plan_code, status, environment').in('user_id', ids),
    ]);
    if (subs.error) console.warn('Subscribers fetch failed:', subs.error);
    if (pagarme.error) console.warn('Pagar.me subscriptions fetch failed:', pagarme.error);
    (subs.data || []).forEach((s) => {
      const current = s.is_active && ['active', 'trialing'].includes(String(s.subscription_status || 'active').toLowerCase());
      if (s.user_id && s.plan_type && (current || !plans[s.user_id])) plans[s.user_id] = s.plan_type;
    });
    (pagarme.data || []).forEach((p) => {
      if (p.user_id && String(p.status).toLowerCase() === 'active' && (p.environment || 'live') === 'live') {
        plans[p.user_id] = p.plan_code || 'pagarme';
      }
    });
    return plans;
  };

  const loadUsers = useCallback(async (filters?: { status?: string; search?: string }, nextPage: number = 0) => {
    if (filters !== undefined) filtersRef.current = filters;
    const active = filtersRef.current;
    const requestId = ++requestRef.current;
    try {
      setIsLoading(true);
      setError(null);
      const [from, to] = pageRange(nextPage, pageSize);
      let query = supabase
        .rpc('get_profiles_admin_with_email', {} as never, { count: 'exact' }) // função sem argumentos (Args: never)
        .order('created_at', { ascending: false });

      if (active.status && STATUS_OPTIONS.has(active.status)) {
        query = query.eq('status', active.status);
      }
      const searchFilter = buildIlikeOrFilter(['name', 'email'], active.search);
      if (searchFilter) query = query.or(searchFilter);

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;
      const profiles = data || [];
      const plans = await loadPlans(profiles.map((p) => p.id));
      if (requestId !== requestRef.current) return;

      setUsers(profiles.map((p) => ({
        id: p.id,
        email: p.email,
        name: p.name || p.email,
        created_at: p.created_at || new Date().toISOString(),
        last_login_at: p.last_login_at,
        status: (STATUS_OPTIONS.has(p.status) ? p.status : 'active') as AdminUserRow['status'],
        plan: plans[p.id] || 'basic',
      })));
      setTotalCount(count ?? 0);
      setPage(nextPage);
    } catch (err) {
      if (requestId !== requestRef.current) return;
      console.error('Error loading admin users:', err);
      setError((err as { message?: string })?.message || 'Erro ao carregar usuários');
    } finally {
      if (requestId === requestRef.current) setIsLoading(false);
    }
  }, [pageSize]);

  const loadStats = useCallback(async () => {
    const [dashboard, activeCount] = await Promise.allSettled([
      AdminDataService.fetchDashboardStats(),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    ]);
    setStats((prev) => {
      const next = { ...prev };
      if (dashboard.status === 'fulfilled') {
        next.total = dashboard.value.totalUsers;
        next.suspended = dashboard.value.suspendedUsers ?? 0;
        next.activeSubscriptions = dashboard.value.activeSubscriptions;
      }
      if (activeCount.status === 'fulfilled' && !activeCount.value.error) {
        next.active = activeCount.value.count ?? 0;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const setLocalStatus = (userId: string, status: AdminUserRow['status']) => {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status } : u)));
    loadStats();
  };

  const suspendUser = async (userId: string) => {
    if (await suspendUserAction(userId)) setLocalStatus(userId, 'suspended');
  };

  const activateUser = async (userId: string) => {
    if (await activateUserAction(userId)) setLocalStatus(userId, 'active');
  };

  return {
    users,
    totalCount,
    page,
    pageSize,
    goToPage: (p: number) => loadUsers(undefined, p),
    loadUsers,
    stats,
    isLoading,
    error,
    actions: { suspendUser, activateUser },
  };
};
