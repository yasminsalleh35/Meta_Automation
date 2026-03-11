
import { useState, useCallback } from 'react';
import { useSupabase } from './useSupabase';
import { useToast } from './use-toast';

interface FacebookPage {
  id: string;
  name: string;
}

interface InstagramAccount {
  id: string;
  name: string;
}

interface SimpleCampaignAssetsData {
  facebookPages: FacebookPage[];
  instagramAccounts: InstagramAccount[];
  message?: string;
}

export const useSimpleCampaignAssets = () => {
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = useSupabase();
  const { toast } = useToast();

  const fetchAssets = useCallback(async () => {
    console.log('[useSimpleCampaignAssets] Starting fetch assets...');
    setIsLoading(true);
    setError(null);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      console.log('[useSimpleCampaignAssets] Calling edge function...');
      
      const { data, error: functionError } = await supabase.functions.invoke(
        'simple-campaign-assets',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (functionError) {
        console.error('[useSimpleCampaignAssets] Function error:', functionError);
        throw functionError;
      }

      console.log('[useSimpleCampaignAssets] Function response:', data);

      const assetsData = data as SimpleCampaignAssetsData;
      
      setFacebookPages(assetsData.facebookPages || []);
      setInstagramAccounts(assetsData.instagramAccounts || []);

      if (assetsData.facebookPages?.length === 0) {
        toast({
          title: "Nenhuma página encontrada",
          description: "Conecte suas páginas do Facebook nas integrações para continuar.",
          variant: "destructive"
        });
      } else {
        console.log(`[useSimpleCampaignAssets] Loaded ${assetsData.facebookPages?.length || 0} Facebook pages`);
      }

    } catch (err) {
      console.error('[useSimpleCampaignAssets] Error fetching assets:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar ativos';
      setError(errorMessage);
      
      toast({
        title: "Erro ao carregar ativos",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [supabase, toast]);

  return {
    facebookPages,
    instagramAccounts,
    isLoading,
    error,
    fetchAssets
  };
};
