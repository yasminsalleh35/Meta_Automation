/**
 * ⚠️ DEPRECATED: Este hook faz chamadas duplicadas ao Meta
 * Use `useMetaAdsAssets` em vez deste hook para reduzir chamadas à API
 * 
 * Hook legado que será consolidado com useMetaAdsAssets
 * Mantido por compatibilidade temporária
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useSupabase } from './useSupabase';
import { useToast } from './use-toast';
import { trackApiCall } from '@/utils/apiCallTracker';

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

interface DynamicMetaAssetsData {
  facebookPages: FacebookPage[];
  instagramAccounts: InstagramAccount[];
  message?: string;
  totalPages?: number;
  totalInstagram?: number;
  error?: string;
}

// ✅ FASE 1: Circuit Breaker otimizado
const MAX_FAILURES = 3; // Open circuit after 3 failures (was 1)
const CIRCUIT_OPEN_TIME = 30000; // Keep circuit open for 30 seconds (was 60s)
const HALF_OPEN_RETRY_TIME = 10000; // Try half-open after 10 seconds
const DEBOUNCE_DELAY = 1000; // Wait 1 second before making request (was 2s)
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache (was 2 minutes)

// ✅ FASE 3: Loading states detalhados
interface LoadingState {
  stage: 'idle' | 'fetching-pages' | 'fetching-instagram' | 'complete';
  pagesProgress: number;
  instagramProgress: number;
  currentMessage: string;
}

export const useDynamicMetaAssets = () => {
  const [facebookPages, setFacebookPages] = useState<FacebookPage[]>([]);
  const [instagramAccounts, setInstagramAccounts] = useState<InstagramAccount[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ FASE 3: Loading state detalhado
  const [loadingState, setLoadingState] = useState<LoadingState>({
    stage: 'idle',
    pagesProgress: 0,
    instagramProgress: 0,
    currentMessage: ''
  });

  // ✅ FASE 3: Retry state com backoff exponencial
  const [retryCount, setRetryCount] = useState(0);
  const [nextRetryIn, setNextRetryIn] = useState<number | null>(null);
  const MAX_RETRIES = 3;
  
  // Circuit breaker state
  const [failureCount, setFailureCount] = useState(0);
  const [isCircuitOpen, setIsCircuitOpen] = useState(false);
  const [lastFailureTime, setLastFailureTime] = useState<number | null>(null);
  
  // Cache state
  const [lastFetchTime, setLastFetchTime] = useState<number | null>(null);
  const [lastSuccessData, setLastSuccessData] = useState<DynamicMetaAssetsData | null>(null);
  
  // Debouncing
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRequestInProgressRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const supabase = useSupabase();
  const { toast } = useToast();

  // ✅ FASE 3: Backoff exponencial - 1s, 2s, 4s
  const getBackoffDelay = useCallback((attempt: number): number => {
    return Math.min(1000 * Math.pow(2, attempt - 1), 4000); // 1s, 2s, 4s max
  }, []);

  const fetchDynamicAssetsInternal = useCallback(async (): Promise<void> => {
    const now = Date.now();
    
    // Check if we have recent cached data
    if (lastFetchTime && lastSuccessData && (now - lastFetchTime) < CACHE_DURATION) {
      console.log('[useDynamicMetaAssets] Using cached data, skipping fetch');
      setFacebookPages(lastSuccessData.facebookPages);
      setInstagramAccounts(lastSuccessData.instagramAccounts);
      setError(null);
      return;
    }

    // ✅ FASE 1: Circuit breaker melhorado com half-open state
    if (isCircuitOpen && lastFailureTime) {
      const timeSinceFailure = now - lastFailureTime;
      
      // Half-open: allow one retry after half the timeout
      if (timeSinceFailure >= HALF_OPEN_RETRY_TIME && timeSinceFailure < CIRCUIT_OPEN_TIME) {
        console.log('[useDynamicMetaAssets] Circuit breaker HALF-OPEN - allowing retry');
        setFailureCount(prev => Math.max(0, prev - 1)); // Reduce failure count
      } else if (timeSinceFailure < HALF_OPEN_RETRY_TIME) {
        console.log('[useDynamicMetaAssets] Circuit breaker OPEN - blocking request', {
          timeSinceFailure,
          failures: failureCount
        });
        
        if (lastSuccessData) {
          console.log('[useDynamicMetaAssets] Using cached data during circuit breaker');
          setFacebookPages(lastSuccessData.facebookPages);
          setInstagramAccounts(lastSuccessData.instagramAccounts);
          setError('Sistema temporariamente indisponível. Aguarde alguns segundos.');
        } else {
          setError('Muitas tentativas recentes. Aguarde alguns segundos.');
        }
        return;
      } else {
        // Full reset after timeout
        console.log('[useDynamicMetaAssets] Circuit breaker CLOSED - full reset');
        setIsCircuitOpen(false);
        setFailureCount(0);
        setLastFailureTime(null);
      }
    }

    // Prevent duplicate requests
    if (isRequestInProgressRef.current) {
      console.log('[useDynamicMetaAssets] Request already in progress, skipping...');
      return;
    }

    console.log('[useDynamicMetaAssets] 🚀 Starting fetch dynamic assets...');
    isRequestInProgressRef.current = true;
    setIsLoading(true);
    setError(null);

    // ✅ FASE 3: Loading state inicial
    setLoadingState({
      stage: 'fetching-pages',
      pagesProgress: 0,
      instagramProgress: 0,
      currentMessage: 'Conectando à Meta API...'
    });

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('User not authenticated');
      }

      // ✅ FASE 3: Update progress - buscando páginas
      setLoadingState(prev => ({
        ...prev,
        pagesProgress: 30,
        currentMessage: 'Buscando páginas do Facebook...'
      }));

      console.log('[useDynamicMetaAssets] Calling meta-dynamic-assets edge function...');
      trackApiCall('meta-dynamic-assets', 'Fetch dynamic assets (DEPRECATED - use useMetaAdsAssets)', 'meta-dynamic-assets');
      
      const { data, error: functionError } = await supabase.functions.invoke(
        'meta-dynamic-assets',
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      // ✅ FASE 3: Update progress - processando Instagram
      setLoadingState(prev => ({
        ...prev,
        stage: 'fetching-instagram',
        pagesProgress: 60,
        instagramProgress: 40,
        currentMessage: `Carregando contas Instagram (${data?.instagramAccounts?.length || 0} encontradas)...`
      }));

      if (functionError) {
        console.error('[useDynamicMetaAssets] Function error:', functionError);
        throw functionError;
      }

      console.log('[useDynamicMetaAssets] Success:', {
        facebookPages: data.facebookPages?.length || 0,
        instagramAccounts: data.instagramAccounts?.length || 0,
        cached: data.cached || false,
        requestId: data.requestId
      });
      
      const successData = {
        facebookPages: data.facebookPages || [],
        instagramAccounts: data.instagramAccounts || []
      };
      
      setFacebookPages(successData.facebookPages);
      setInstagramAccounts(successData.instagramAccounts);
      setError(null);
      
      // ✅ FASE 3: Complete loading state
      setLoadingState({
        stage: 'complete',
        pagesProgress: 100,
        instagramProgress: 100,
        currentMessage: `✅ ${successData.facebookPages.length} página(s) e ${successData.instagramAccounts.length} Instagram carregados`
      });

      // ✅ FASE 3: Reset retry count on success
      setRetryCount(0);
      setNextRetryIn(null);
      
      // Update cache
      setLastFetchTime(now);
      setLastSuccessData(successData);
      
      // Reset circuit breaker on success
      if (failureCount > 0) {
        setFailureCount(0);
        setIsCircuitOpen(false);
        setLastFailureTime(null);
      }

      if (data.error) {
        console.warn('[useDynamicMetaAssets] API warning:', data.error);
        if (data.error.includes('Rate limit')) {
          // Don't show toast for rate limiting, just use cached data
          console.log('[useDynamicMetaAssets] Rate limited, using existing data');
        } else {
          toast({
            title: "Aviso",
            description: "Dados parcialmente carregados: " + data.error,
            variant: "default"
          });
        }
      } else if (data.facebookPages?.length === 0) {
        // Only show this message once, not repeatedly
        if (facebookPages.length === 0) {
          toast({
            title: "Nenhuma página encontrada",
            description: "Conecte suas páginas do Facebook nas integrações para continuar.",
            variant: "destructive"
          });
        }
      } else {
        console.log(`[useDynamicMetaAssets] Loaded ${data.facebookPages?.length || 0} Facebook pages and ${data.instagramAccounts?.length || 0} Instagram accounts`);
      }

    } catch (err: any) {
      console.error('[useDynamicMetaAssets] ❌ Function error:', err);
      
      const newFailureCount = failureCount + 1;
      setFailureCount(newFailureCount);
      setLastFailureTime(now);
      
      // Enhanced rate limit detection
      const isRateLimit = err?.message?.includes('429') || 
                         err?.message?.includes('Rate limit') || 
                         err?.message?.includes('Too many requests') ||
                         err?.message?.includes('rate limit') ||
                         err?.message?.includes('Application request limit') ||
                         err?.status === 429;

      if (isRateLimit || newFailureCount >= MAX_FAILURES) {
        console.log('[useDynamicMetaAssets] Opening circuit breaker:', isRateLimit ? 'Rate limit' : 'Max failures');
        setIsCircuitOpen(true);
      }

      // ✅ FASE 3: Retry inteligente com backoff exponencial
      const currentRetry = retryCount + 1;
      if (currentRetry <= MAX_RETRIES && !isRateLimit) {
        const backoffDelay = getBackoffDelay(currentRetry);
        const backoffSeconds = Math.ceil(backoffDelay / 1000);
        
        console.log(`[useDynamicMetaAssets] 🔄 Scheduling retry ${currentRetry}/${MAX_RETRIES} in ${backoffSeconds}s`);
        
        setRetryCount(currentRetry);
        setNextRetryIn(backoffSeconds);
        
        // Update loading state for retry
        setLoadingState({
          stage: 'fetching-pages',
          pagesProgress: 0,
          instagramProgress: 0,
          currentMessage: `Tentativa ${currentRetry}/${MAX_RETRIES} em ${backoffSeconds}s...`
        });

        // Countdown timer
        const countdownInterval = setInterval(() => {
          setNextRetryIn(prev => {
            if (prev === null || prev <= 1) {
              clearInterval(countdownInterval);
              return null;
            }
            return prev - 1;
          });
        }, 1000);

        // Schedule retry
        retryTimeoutRef.current = setTimeout(() => {
          clearInterval(countdownInterval);
          console.log('[useDynamicMetaAssets] 🔄 Executing retry', currentRetry);
          fetchDynamicAssetsInternal();
        }, backoffDelay);

        return; // Don't show error toast yet, we're retrying
      } else if (currentRetry > MAX_RETRIES) {
        console.error('[useDynamicMetaAssets] ❌ Max retries exceeded');
        setLoadingState({
          stage: 'idle',
          pagesProgress: 0,
          instagramProgress: 0,
          currentMessage: 'Falha após múltiplas tentativas'
        });
      }
      
      // Enhanced error handling with fallback to cached data
      if (isRateLimit) {
        console.log('[useDynamicMetaAssets] Rate limit detected');
        if (lastSuccessData) {
          console.log('[useDynamicMetaAssets] Using cached data during rate limit');
          setFacebookPages(lastSuccessData.facebookPages);
          setInstagramAccounts(lastSuccessData.instagramAccounts);
          setError('Rate limit reached. Using cached data. Will retry automatically.');
        } else {
          setFacebookPages([]);
          setInstagramAccounts([]);
          setError('Rate limit reached. Please wait before trying again.');
        }
      } else if (err?.message?.includes('403') || err?.message?.includes('Forbidden')) {
        setError('Access denied. Please reconnect your Meta integration.');
        setFacebookPages([]);
        setInstagramAccounts([]);
      } else if (err?.message?.includes('Network') || err?.message?.includes('timeout')) {
        setError('Network error. Using cached data if available.');
        if (lastSuccessData) {
          setFacebookPages(lastSuccessData.facebookPages);
          setInstagramAccounts(lastSuccessData.instagramAccounts);
        } else {
          setFacebookPages([]);
          setInstagramAccounts([]);
        }
      } else {
        const errorMsg = err?.message || 'Failed to fetch Meta assets. Please try again.';
        setError(errorMsg);
        
        // Fallback to cached data for unknown errors
        if (lastSuccessData) {
          console.log('[useDynamicMetaAssets] Using cached data for unknown error');
          setFacebookPages(lastSuccessData.facebookPages);
          setInstagramAccounts(lastSuccessData.instagramAccounts);
        } else {
          setFacebookPages([]);
          setInstagramAccounts([]);
        }
      }
    } finally {
      setIsLoading(false);
      isRequestInProgressRef.current = false;
    }
  }, [supabase, toast, failureCount, lastFetchTime, lastSuccessData, isCircuitOpen, lastFailureTime, facebookPages.length]); // Updated dependencies

  // Debounced version of fetch with enhanced delay
  const fetchDynamicAssets = useCallback(() => {
    // Clear existing timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    // Set new timeout with longer delay for rate limiting
    debounceTimeoutRef.current = setTimeout(() => {
      fetchDynamicAssetsInternal();
    }, DEBOUNCE_DELAY);
  }, [fetchDynamicAssetsInternal]);

  // ✅ FASE 3: Cleanup on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return {
    facebookPages,
    instagramAccounts,
    isLoading,
    error,
    lastFetched: lastFetchTime ? new Date(lastFetchTime) : null,
    fetchDynamicAssets,
    totalAssets: facebookPages.length + instagramAccounts.length,
    // Circuit breaker status
    isCircuitOpen,
    failureCount,
    // Cache information
    isCached: lastSuccessData !== null,
    cacheAge: lastFetchTime ? Date.now() - lastFetchTime : null,
    // ✅ FASE 3: Loading state detalhado
    loadingState,
    retryCount,
    nextRetryIn
  };
};