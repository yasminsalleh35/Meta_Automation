import { useState, useCallback, useRef, useEffect } from 'react';
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

// audit CMP-11: no máximo 3 tentativas no total, backoff exponencial (1s, 2s)
const MAX_ATTEMPTS = 3;
const BASE_RETRY_DELAY_MS = 1000;
export const NO_META_INTEGRATION_MESSAGE = 'Conecte sua conta Meta';

// Sem integração Meta não adianta repetir: o backend devolve code NO_INTEGRATION (200) ou 404
const isNoIntegrationError = (data: any, err: any): boolean =>
  data?.code === 'NO_INTEGRATION' ||
  err?.context?.status === 404;

export const useUnifiedMetaAssets = () => {
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const isRequestInProgressRef = useRef(false);
  // Contador em ref: o state ficava preso no closure e o retry nunca parava
  const retryCountRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);
  const doFetchRef = useRef<(forceRefresh: boolean, isRetry: boolean) => Promise<void>>();
  const { toast } = useToast();

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, []);

  const doFetch = useCallback(async (forceRefresh: boolean, isRetry: boolean): Promise<void> => {
    if (!isMountedRef.current) return;

    // Chamada externa (não-retry) reinicia o ciclo de tentativas
    if (!isRetry) {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      retryCountRef.current = 0;
      setRetryCount(0);
    }

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

      if (isNoIntegrationError(data, functionError)) {
        console.log('[useUnifiedMetaAssets] No Meta integration — not retrying');
        setAdAccounts([]);
        setFacebookPages([]);
        setInstagramAccounts([]);
        setError(NO_META_INTEGRATION_MESSAGE);
        return;
      }

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
      retryCountRef.current = 0;
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

      // Retry logic with exponential backoff (limitado por MAX_ATTEMPTS)
      const currentRetry = retryCountRef.current;
      if (currentRetry < MAX_ATTEMPTS - 1 && isMountedRef.current) {
        const delay = BASE_RETRY_DELAY_MS * Math.pow(2, currentRetry);
        console.log(`[useUnifiedMetaAssets] Retrying in ${delay}ms (attempt ${currentRetry + 2}/${MAX_ATTEMPTS})`);

        retryCountRef.current = currentRetry + 1;
        setRetryCount(currentRetry + 1);

        retryTimerRef.current = setTimeout(() => {
          retryTimerRef.current = null;
          doFetchRef.current?.(forceRefresh, true);
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
  }, [toast]);

  doFetchRef.current = doFetch;

  const fetchAllAssets = useCallback(
    (forceRefresh = false): Promise<void> => doFetch(forceRefresh, false),
    [doFetch]
  );

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
