
import { useState, useEffect, useCallback } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useAuth } from '@/contexts/AuthContext';

interface Integration {
  id: string;
  provider: string;
  status: string;
  access_token?: string;
  created_at: string;
  updated_at: string;
}

export const useRobustIntegration = () => {
  const supabase = useSupabase();
  const { session, isAuthenticated } = useAuth();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchIntegrations = useCallback(async () => {
    if (!isAuthenticated || !session?.user) {
      setIntegrations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔍 Fetching integrations for user:', session.user.id);
      
      // ✅ CORREÇÃO: Usar 'meta' em vez de 'meta_ads' e headers corretos
      const { data, error: queryError } = await supabase
        .from('integrations')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('provider', 'meta_ads') // Mantendo meta_ads conforme schema atual
        .single();

      // Se der erro 406 ou PGRST116, tentar com 'meta'
      if (queryError && (queryError.code === 'PGRST116' || queryError.message?.includes('406'))) {
        console.log('🔄 Tentando com provider="meta"...');
        
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('integrations')
          .select('*')
          .eq('user_id', session.user.id)
          .eq('provider', 'meta')
          .single();

        if (fallbackError && fallbackError.code !== 'PGRST116') {
          console.error('❌ Error fetching integrations (fallback):', fallbackError);
          setIntegrations([]);
          setError(`Erro ao carregar integrações: ${fallbackError.message}`);
        } else {
          console.log('✅ Integrations fetched successfully (fallback):', fallbackData);
          setIntegrations(fallbackData ? [fallbackData] : []);
        }
      } else if (queryError && queryError.code !== 'PGRST116') {
        console.error('❌ Error fetching integrations:', queryError);
        setIntegrations([]);
        setError(`Erro ao carregar integrações: ${queryError.message}`);
      } else {
        console.log('✅ Integrations fetched successfully:', data);
        setIntegrations(data ? [data] : []);
      }
    } catch (error) {
      console.error('🚨 Unexpected error fetching integrations:', error);
      setIntegrations([]);
      setError('Erro inesperado ao carregar integrações');
    } finally {
      setLoading(false);
    }
  }, [supabase, session?.user, isAuthenticated]);

  const getActiveMetaAdsIntegration = useCallback(() => {
    return integrations.find(
      integration => 
        (integration.provider === 'meta_ads' || integration.provider === 'meta') && 
        integration.status === 'active'
    );
  }, [integrations]);

  useEffect(() => {
    if (isAuthenticated && session?.user) {
      fetchIntegrations();
    } else {
      setIntegrations([]);
      setLoading(false);
      setError(null);
    }
  }, [fetchIntegrations, isAuthenticated, session?.user]);

  return {
    integrations,
    loading,
    error,
    refetch: fetchIntegrations,
    activeMetaAdsIntegration: getActiveMetaAdsIntegration()
  };
};
