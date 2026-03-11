
import { useState, useEffect } from 'react';
import { useSupabase } from '@/hooks/useSupabase';

interface GlobalMetaConfig {
  appId: string;
  appSecret: string;
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
        const { data, error } = await supabase.rpc('get_meta_ads_config');
        
        if (error) {
          console.error('Error fetching Meta Ads config:', error);
          setError('Erro ao buscar configurações');
          return;
        }

        if (data && data.length > 0) {
          const configData = data[0];
          setConfig({
            appId: configData.app_id,
            appSecret: configData.app_secret,
            businessManagerId: configData.business_manager_id
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
