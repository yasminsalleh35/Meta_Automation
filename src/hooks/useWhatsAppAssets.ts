import { useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useToast } from './use-toast';

interface PhoneNumber {
  id: string;
  display_phone_number: string;
  verified_name: string;
}

interface WABA {
  id: string;
  name: string;
  phone_numbers: PhoneNumber[];
}

interface Business {
  id: string;
  name: string;
  wabas: WABA[];
}

interface WhatsAppAssetsData {
  businesses: Business[];
}

export const useWhatsAppAssets = () => {
  const [data, setData] = useState<WhatsAppAssetsData>({ businesses: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<number>(0);
  
  const supabase = useSupabase();
  const { toast } = useToast();

  const fetchWhatsAppAssets = useCallback(async (force: boolean = false) => {
    // Simple 2-minute cache
    const now = Date.now();
    if (!force && (now - lastFetch) < 2 * 60 * 1000) {
      return data;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authenticated session');
      }

      const response = await supabase.functions.invoke('meta-whatsapp-assets', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to fetch WhatsApp assets');
      }

      const result = response.data || { businesses: [] };
      setData(result);
      setLastFetch(now);
      setError(null);
      
      return result;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Error fetching WhatsApp assets:', err);
      
      toast({
        title: "Erro ao carregar WhatsApp",
        description: errorMessage,
        variant: "destructive"
      });
      
      return { businesses: [] };
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast, lastFetch, data]);

  const saveWhatsAppSelection = useCallback(async (selection: {
    business_id: string;
    waba_id: string;
    phone_number_id: string;
    display_phone_number?: string;
    verified_name?: string;
  }) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('No authenticated session');
      }

      const response = await supabase.functions.invoke('meta-whatsapp-save-selection', {
        body: selection,
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to save WhatsApp selection');
      }

      toast({
        title: "WhatsApp salvo",
        description: `Número ${selection.display_phone_number} selecionado com sucesso.`,
        variant: "default"
      });

      return response.data;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('Error saving WhatsApp selection:', err);
      
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive"
      });
      
      throw err;
    }
  }, [supabase, toast]);

  return {
    data,
    isLoading,
    error,
    fetchWhatsAppAssets,
    saveWhatsAppSelection,
  };
};