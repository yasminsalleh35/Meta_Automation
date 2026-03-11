import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentSettings {
  enablePagarmeOnly: boolean;
  rolloutPercentage: number;
  loading: boolean;
}

export function usePaymentSettings(): PaymentSettings {
  const [loading, setLoading] = useState(true);
  const [enablePagarmeOnly, setEnablePagarmeOnly] = useState(false);
  const [rolloutPercentage, setRolloutPercentage] = useState(0);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.rpc('get_payment_setting', { 
          p_setting_key: 'enable_pagarme_only' 
        });
        
        if (!error && data && data.length > 0) {
          const settingValue = data[0].setting_value;
          setEnablePagarmeOnly(Boolean(settingValue?.enabled));
          setRolloutPercentage(Number(settingValue?.rollout_percentage ?? 0));
        }
      } catch (error) {
        console.error('Error fetching payment settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { 
    loading, 
    enablePagarmeOnly, 
    rolloutPercentage 
  };
}