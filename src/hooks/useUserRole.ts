
import { useState, useEffect, useCallback, useRef } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole, UseUserRoleReturn } from '@/types/userRole';
import { getCachedRole, setCachedRole, clearRoleCache } from '@/utils/roleCacheUtils';
import { fetchUserRoleFromAPI } from '@/services/userRoleService';
import { isAuthRoute } from '@/utils/routerGuards';

export const useUserRole = (): UseUserRoleReturn => {
  const supabase = useSupabase();
  const { session, isAuthenticated, mustChangePassword } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUserIdRef = useRef<string | null>(null);
  const isInitializedRef = useRef(false);
  
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const fetchUserRole = useCallback(async (): Promise<void> => {
    // Skip role fetch apenas em rotas de autenticação ou se senha precisa ser alterada
    if (isAuthRoute() || mustChangePassword) {
      console.log('[useUserRole] SKIP fetch | isAuthRoute:', isAuthRoute(), 'mustChange:', mustChangePassword);
      setRole('user');
      setLoading(false);
      return;
    }

    if (!isAuthenticated || !session?.user) {
      setRole('user');
      setLoading(false);
      clearRoleCache();
      return;
    }

    const userId = session.user.id;

    // Tentar usar cache primeiro
    const cachedRole = getCachedRole(userId);
    if (cachedRole) {
      setRole(cachedRole);
      setLoading(false);
      setError(null);
      return;
    }

    // Cleanup requests anteriores
    cleanup();
    abortControllerRef.current = new AbortController();
    
    setLoading(true);
    setError(null);

    try {
      const userRole = await fetchUserRoleFromAPI(supabase, userId);
      
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setRole(userRole);
      setCachedRole(userRole, userId);
      setError(null);
    } catch (error) {
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('useUserRole: Error fetching role:', error);
      setError('Erro ao verificar permissões');
      setRole('user'); // Fallback seguro
    } finally {
      if (!abortControllerRef.current?.signal.aborted) {
        setLoading(false);
      }
    }
  }, [isAuthenticated, session?.user?.id, supabase, cleanup]);

  const refetchRole = useCallback(async (): Promise<void> => {
    lastUserIdRef.current = null;
    clearRoleCache();
    await fetchUserRole();
  }, [fetchUserRole]);

  useEffect(() => {
    // Skip role fetch apenas em rotas de autenticação ou se senha precisa ser alterada
    if (isAuthRoute() || mustChangePassword) {
      console.log('[useUserRole] SKIP effect | isAuthRoute:', isAuthRoute(), 'mustChange:', mustChangePassword);
      setRole('user');
      setLoading(false);
      setError(null);
      isInitializedRef.current = true;
      return;
    }
    
    cleanup();
    
    if (isAuthenticated && session?.user) {
      const userId = session.user.id;
      
      // Se o usuário mudou, limpar tudo
      if (lastUserIdRef.current && lastUserIdRef.current !== userId) {
        console.log('useUserRole: User changed, clearing all state');
        setRole(null);
        setLoading(false);
        setError(null);
        clearRoleCache();
        lastUserIdRef.current = null;
      }
      
      // Verificar cache primeiro
      const cachedRole = getCachedRole(userId);
      if (cachedRole) {
        console.log('useUserRole: Using cached role in effect:', cachedRole);
        setRole(cachedRole);
        setLoading(false);
        setError(null);
        lastUserIdRef.current = userId;
        isInitializedRef.current = true;
      } else {
        // Buscar imediatamente (sem delay)
        console.log('useUserRole: No cache, fetching from API');
        fetchUserRole();
        lastUserIdRef.current = userId;
        isInitializedRef.current = true;
      }
    } else {
      setRole('user');
      setLoading(false);
      setError(null);
      lastUserIdRef.current = null;
      clearRoleCache();
      isInitializedRef.current = true;
    }

    return cleanup;
  }, [isAuthenticated, session?.user?.id, fetchUserRole, cleanup]);

  // Safety timeout para evitar loading infinito
  useEffect(() => {
    if (loading) {
      const safetyTimeout = setTimeout(() => {
        setLoading(false);
        setRole('user');
        setError(null);
      }, 3000);

      return () => clearTimeout(safetyTimeout);
    }
  }, [loading]);

  const result = {
    role: role || 'user', // Sempre retornar um role válido
    loading,
    isAdmin: role === 'admin' || role === 'super_admin',
    error,
    refetchRole
  };

  return result;
};
