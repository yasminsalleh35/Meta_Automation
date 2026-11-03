
import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

// Configuração pública do Meta App. O app secret NUNCA chega ao navegador (audit SEC-04):
// as edge functions o leem com service role.
interface GlobalMetaConfig {
  appId: string;
  businessManagerId?: string;
}

export const useGlobalMetaConfig = () => {
  const supabase = useSupabase();
  const [config, setConfig] = useState<GlobalMetaConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const { data, error } = await supabase.rpc('get_meta_app_public_config' as any);

        if (error) {
          console.error('Error fetching Meta Ads config:', error.message);
          setError('Erro ao buscar configurações');
          return;
        }

        const rows = (data as Array<{ app_id: string; business_manager_id: string | null }> | null) ?? [];
        if (rows.length > 0 && rows[0].app_id) {
          setConfig({
            appId: rows[0].app_id,
            businessManagerId: rows[0].business_manager_id ?? undefined
          });
        } else {
          setError('Configurações Meta Ads não encontradas');
        }
      } catch (err) {
        console.error('Error in fetchConfig:', err);
        setError('Erro inesperado ao buscar configurações');
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [supabase]);

  return { config, loading, error };
};
