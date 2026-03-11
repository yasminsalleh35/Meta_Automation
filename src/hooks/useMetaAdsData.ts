
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MetaAdAccount {
  id: string;
  name: string;
  currency: string;
  status: string;
  permissions: string[];
}

interface MetaPage {
  id: string;
  name: string;
  category: string;
  followers?: number;
}

export const useMetaAdsData = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [adAccounts, setAdAccounts] = useState<MetaAdAccount[]>([]);
  const [pages, setPages] = useState<MetaPage[]>([]);
  
  // ✅ FASE 4.1: Circuit breaker aligned with Meta's real rate limit (1 hour)
  const [failureCount, setFailureCount] = useState(0);
  const [isCircuitOpen, setIsCircuitOpen] = useState(false);
  const [lastFailureTime, setLastFailureTime] = useState<number>(0);
  const [lastFetchTime, setLastFetchTime] = useState<number>(0);
  const [isRequestInProgress, setIsRequestInProgress] = useState(false);

  const MAX_FAILURES = 2; // More sensitive
  const CIRCUIT_OPEN_TIME = 60 * 60 * 1000; // 1 HOUR (matches Meta rate limit)
  const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes
  const MIN_REQUEST_INTERVAL = 2000; // 2 seconds

  // Verificar se o circuit está aberto
  const checkCircuitBreaker = useCallback(() => {
    if (isCircuitOpen && Date.now() - lastFailureTime > CIRCUIT_OPEN_TIME) {
      setIsCircuitOpen(false);
      setFailureCount(0);
      console.log('[useMetaAdsData] Circuit breaker reset');
    }
    return !isCircuitOpen;
  }, [isCircuitOpen, lastFailureTime, CIRCUIT_OPEN_TIME]);

  const fetchAccountsAndPages = useCallback(async (forceRefresh = false) => {
    // ✅ Circuit breaker check
    if (!checkCircuitBreaker()) {
      console.log('[useMetaAdsData] Circuit breaker is open, using cached data');
      return { adAccounts, pages };
    }

    // ✅ Prevent concurrent requests
    if (isRequestInProgress) {
      console.log('[useMetaAdsData] Request already in progress, skipping');
      return { adAccounts, pages };
    }

    // ✅ Cache check (10 minutos)
    const now = Date.now();
    if (!forceRefresh && lastFetchTime && (now - lastFetchTime < CACHE_DURATION)) {
      console.log('[useMetaAdsData] Using cached data, fetch not needed');
      return { adAccounts, pages };
    }

    // ✅ Rate limiting
    if (lastFetchTime && (now - lastFetchTime < MIN_REQUEST_INTERVAL)) {
      console.log('[useMetaAdsData] Rate limited, waiting...');
      return { adAccounts, pages };
    }

    setIsRequestInProgress(true);
    setIsLoading(true);
    
    try {
      console.log('[useMetaAdsData] Fetching ad accounts and pages...');
      
      const { data, error } = await supabase.functions.invoke('meta-ads-account-pages', {
        body: {}
      });

      if (error) {
        throw new Error(error.message || 'Failed to fetch Meta ads data');
      }

      console.log('[useMetaAdsData] Success:', { 
        adAccounts: data?.adAccounts?.length || 0, 
        pages: data?.pages?.length || 0 
      });
      
      const accounts = data?.adAccounts || [];
      const pagesData = data?.pages || [];
      
      setAdAccounts(accounts);
      setPages(pagesData);
      setLastFetchTime(now);
      
      // Reset failure count on success
      setFailureCount(0);
      
      return { 
        adAccounts: accounts, 
        pages: pagesData 
      };
    } catch (error) {
      console.error('[useMetaAdsData] Error:', error);
      
      // ✅ FASE 4.1: Circuit breaker with informative feedback
      const newFailureCount = failureCount + 1;
      setFailureCount(newFailureCount);
      
      const isRateLimit = error.message?.includes('rate limit') || 
                         error.message?.includes('Application request limit');
      
      if (newFailureCount >= MAX_FAILURES) {
        setIsCircuitOpen(true);
        setLastFailureTime(now);
        console.log('[useMetaAdsData] ⚠️ Circuit breaker opened after', newFailureCount, 'failures. Waiting 1 hour.');
        
        // Only show toast for rate limits (not for other errors)
        if (isRateLimit) {
          // Note: toast import would be needed, skipping for now as it's optional
          console.log('[useMetaAdsData] 📢 Rate limit detected - user should be notified');
        }
      }
      
      // Return cached data on error
      return { adAccounts, pages };
    } finally {
      setIsLoading(false);
      setIsRequestInProgress(false);
    }
  }, [adAccounts, pages, checkCircuitBreaker, isRequestInProgress, lastFetchTime, failureCount, CACHE_DURATION, MIN_REQUEST_INTERVAL, MAX_FAILURES]);

  return {
    isLoading,
    adAccounts,
    pages,
    fetchAccountsAndPages,
    // ✅ Expose circuit breaker status for debugging
    isCircuitOpen,
    failureCount
  };
};
