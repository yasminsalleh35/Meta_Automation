import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from './use-toast';
import { metaCache } from '@/lib/metaCache';

interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  status: string;
  permissions: string[];
}

interface FacebookPage {
  id: string;
  name: string;
  pictureUrl?: string;
  whatsappNumber?: string;
  whatsappVerifiedName?: string;
}

interface InstagramAccount {
  id: string;
  name: string;
  pageId: string;
  profilePictureUrl?: string;
}

interface UnifiedAssetsData {
  adAccounts: MetaAdAccount[];
  facebookPages: FacebookPage[];
  instagramAccounts: InstagramAccount[];
  cached?: boolean;
  timestamp?: number;
}

const MAX_RETRIES = 2;
const RETRY_DELAYS = [1000, 2000]; // 1s, 2s

export const useUnifiedMetaAssets = () => {
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isRequestInProgressRef = useRef(false);
  const { toast } = useToast();

  const fetchAllAssets = useCallback(async (forceRefresh = false): Promise<void> => {
    // Prevent concurrent requests
    if (isRequestInProgressRef.current) {
      console.log('[useUnifiedMetaAssets] Request already in progress');
      return;
    }

    // Check cache first
    if (!forceRefresh) {
      const cached = metaCache.get<UnifiedAssetsData>('unified-assets');
      if (cached) {
        console.log('[useUnifiedMetaAssets] Using cached data');
        setAdAccounts(cached.adAccounts);
        setFacebookPages(cached.facebookPages);
        setInstagramAccounts(cached.instagramAccounts);
        setError(null);
        return;
      }
    }

    isRequestInProgressRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log('[useUnifiedMetaAssets] Fetching cached assets...');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // ✅ FASE 1: Usar nova edge function com cache inteligente (DB → Meta API)
      const { data, error: functionError } = await supabase.functions.invoke(
        'meta-assets-cached',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      const assetsData: UnifiedAssetsData = {
        adAccounts: data.adAccounts || [],
        facebookPages: data.facebookPages || [],
        instagramAccounts: data.instagramAccounts || [],
        cached: data.cached || false,
        timestamp: data.timestamp || Date.now()
      };

      // Update state
      setAdAccounts(assetsData.adAccounts);
      setFacebookPages(assetsData.facebookPages);
      setInstagramAccounts(assetsData.instagramAccounts);
      setError(null);
      setRetryCount(0);

      // Cache response
      metaCache.set('unified-assets', assetsData);

      console.log('[useUnifiedMetaAssets] Success:', {
        adAccounts: assetsData.adAccounts.length,
        pages: assetsData.facebookPages.length,
        instagram: assetsData.instagramAccounts.length,
        cached: data.cached,
        source: data.source,
        cacheAge: data.cacheAge ? `${data.cacheAge}s` : 'fresh'
      });

      // Show warning if no data
      if (assetsData.adAccounts.length === 0 && assetsData.facebookPages.length === 0) {
        toast({
          title: "Nenhum ativo encontrado",
          description: "Verifique suas permissões na integração Meta.",
          variant: "default"
        });
      }

    } catch (err: any) {
      console.error('[useUnifiedMetaAssets] Error:', err);

      // Retry logic with exponential backoff
      const currentRetry = retryCount;
      if (currentRetry < MAX_RETRIES) {
        const delay = RETRY_DELAYS[currentRetry];
        console.log(`[useUnifiedMetaAssets] Retrying in ${delay}ms (attempt ${currentRetry + 1}/${MAX_RETRIES})`);
        
        setRetryCount(currentRetry + 1);
        
        setTimeout(() => {
          isRequestInProgressRef.current = false;
          fetchAllAssets(forceRefresh);
        }, delay);
        
        return;
      }

      // Max retries reached - try to use cached data
      const cached = metaCache.get<UnifiedAssetsData>('unified-assets');
      if (cached) {
        console.log('[useUnifiedMetaAssets] Using stale cache after error');
        setAdAccounts(cached.adAccounts);
        setFacebookPages(cached.facebookPages);
        setInstagramAccounts(cached.instagramAccounts);
        setError('Usando dados em cache. Clique em "Atualizar" para tentar novamente.');
      } else {
        setError(err?.message || 'Erro ao carregar ativos');
        setAdAccounts([]);
        setFacebookPages([]);
        setInstagramAccounts([]);
      }

      toast({
        title: "Erro ao carregar ativos",
        description: "Não foi possível carregar os ativos Meta. Tente novamente.",
        variant: "destructive"
      });

    } finally {
      setIsLoading(false);
      isRequestInProgressRef.current = false;
    }
  }, [toast, retryCount]);

  // Clear cache and refetch
  const clearCacheAndRefetch = useCallback(async () => {
    metaCache.clear('unified-assets');
    await fetchAllAssets(true);
  }, [fetchAllAssets]);

  return {
    adAccounts,
    facebookPages,
    instagramAccounts,
    isLoading,
    error,
    fetchAllAssets,
    clearCacheAndRefetch,
    retryCount
  };
};
