import { useState, useEffect, useRef } from 'react';
import { useMetaAdsIntegration } from './useMetaAdsIntegration';
import { metaAdsService } from '@/services/metaAdsService';
import { metaAdsAccountService } from '@/services/metaAds/MetaAdsAccountService';
import { useToast } from '@/hooks/use-toast';

interface MetaAsset {
  id: string;
  name: string;
  type: 'page' | 'instagram' | 'whatsapp';
  connected: boolean;
  status?: string;
  category?: string;
  followers?: number;
  phone?: string;
  username?: string;
  profilePic?: string;
  isManual?: boolean;
  isPageConnected?: boolean;
  pageAccessToken?: string; // NEW: Store page access token
}

interface PageWithToken {
  id: string;
  name: string;
  category?: string;
  fan_count?: number;
  access_token: string;
}

interface ManualWhatsApp {
  id: string;
  name: string;
  phone: string;
}

interface LoadResult {
  success: boolean;
  pages: MetaAsset[];
  instagram: MetaAsset[];
  whatsapp: MetaAsset[];
  errors: string[];
  diagnostics: {
    tokenValid: boolean;
    permissions: string[];
    hasRequiredPermissions?: boolean;
    hasInstagramPermissions?: boolean;
    pagesError?: string;
    instagramError?: string;
    whatsappError?: string;
  };
}

// ✅ CACHE GLOBAL: 30 minutos de cache em localStorage
const ASSETS_CACHE_KEY = 'camply_meta_assets_cache';
const CACHE_TTL = 30 * 60 * 1000; // 30 minutos

export const useMetaAdsAssets = () => {
  const { toast } = useToast();
  const { existingIntegration } = useMetaAdsIntegration();
  const [isLoading, setIsLoading] = useState(false);
  const loadingRef = useRef(false);
  const lastLoadTimeRef = useRef(0);
  const [lastLoadResult, setLastLoadResult] = useState<LoadResult | null>(null);
  const [assets, setAssets] = useState<{
    pages: MetaAsset[];
    instagram: MetaAsset[];
    whatsapp: MetaAsset[];
  }>({
    pages: [],
    instagram: [],
    whatsapp: []
  });

  // Cache for pages with tokens to avoid repeated API calls
  const pagesWithTokensRef = useRef<PageWithToken[]>([]);
  
  const RATE_LIMIT_COOLDOWN = 15 * 1000;

  // ✅ CACHE: Get cached assets from localStorage
  const getCachedAssets = (): { data: any; timestamp: number } | null => {
    try {
      const cached = localStorage.getItem(ASSETS_CACHE_KEY);
      if (!cached) return null;
      
      const parsed = JSON.parse(cached);
      const age = Date.now() - parsed.timestamp;
      
      if (age > CACHE_TTL) {
        console.log('[META_ASSETS] Cache expired, age:', Math.round(age / 1000), 's');
        localStorage.removeItem(ASSETS_CACHE_KEY);
        return null;
      }
      
      console.log('[META_ASSETS] Using cache, age:', Math.round(age / 1000), 's');
      return parsed;
    } catch (error) {
      console.error('[META_ASSETS] Error reading cache:', error);
      return null;
    }
  };

  // ✅ CACHE: Set cached assets to localStorage
  const setCachedAssets = (data: any) => {
    try {
      localStorage.setItem(ASSETS_CACHE_KEY, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      console.log('[META_ASSETS] Assets cached');
    } catch (error) {
      console.error('[META_ASSETS] Error writing cache:', error);
    }
  };

  // Load manual WhatsApp numbers from localStorage
  const getManualWhatsAppNumbers = (): ManualWhatsApp[] => {
    try {
      const stored = localStorage.getItem('camply_manual_whatsapp');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error loading manual WhatsApp numbers:', error);
      return [];
    }
  };

  // Save manual WhatsApp numbers to localStorage
  const saveManualWhatsAppNumbers = (numbers: ManualWhatsApp[]) => {
    try {
      localStorage.setItem('camply_manual_whatsapp', JSON.stringify(numbers));
    } catch (error) {
      console.error('Error saving manual WhatsApp numbers:', error);
    }
  };

  // Add manual WhatsApp number
  const addManualWhatsApp = (whatsappData: { id: string; name: string; phone: string }) => {
    const current = getManualWhatsAppNumbers();
    const updated = [...current, whatsappData];
    saveManualWhatsAppNumbers(updated);
    
    setAssets(prev => ({
      ...prev,
      whatsapp: [
        ...prev.whatsapp,
        {
          id: whatsappData.id,
          name: whatsappData.name,
          type: 'whatsapp',
          connected: true,
          phone: whatsappData.phone,
          isManual: true
        }
      ]
    }));

    toast({
      title: "WhatsApp adicionado",
      description: "Número do WhatsApp foi adicionado com sucesso.",
    });
  };

  // Remove manual WhatsApp number
  const removeManualWhatsApp = (id: string) => {
    const current = getManualWhatsAppNumbers();
    const updated = current.filter(wa => wa.id !== id);
    saveManualWhatsAppNumbers(updated);
    
    setAssets(prev => ({
      ...prev,
      whatsapp: prev.whatsapp.filter(wa => wa.id !== id)
    }));

    toast({
      title: "WhatsApp removido",
      description: "Número do WhatsApp foi removido.",
    });
  };

  // Get Instagram accounts for a specific page
  const getInstagramAccountsForPage = async (pageId: string, pageAccessToken: string): Promise<MetaAsset[]> => {
    try {
      console.log(`[META_ASSETS] Fetching Instagram for page ${pageId} with page token...`);
      const connectedAccounts = await metaAdsAccountService.getConnectedInstagramAccounts(pageId, pageAccessToken);
      console.log(`[META_ASSETS] Found ${connectedAccounts.length} Instagram accounts for page ${pageId}`);
      
      return connectedAccounts.map(ig => ({
        id: ig.id,
        name: ig.name || `@${ig.username}`,
        type: 'instagram' as const,
        connected: true,
        username: ig.username,
        profilePic: ig.profile_pic,
        isPageConnected: true
      }));
    } catch (error) {
      console.warn(`[META_ASSETS] Error fetching Instagram accounts for page ${pageId}:`, error);
      throw error;
    }
  };

  // Improved rate limit checking
  const shouldAttemptLoad = () => {
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    const hasAssets = assets.pages.length > 0 || assets.instagram.length > 0;
    
    // Always allow load if no assets exist or enough time has passed
    if (!hasAssets || timeSinceLastLoad > RATE_LIMIT_COOLDOWN) {
      return true;
    }
    
    console.log(`[META_ASSETS] Rate limit active. Time since last load: ${Math.round(timeSinceLastLoad / 1000)}s`);
    return false;
  };

  // Detect rate limit error
  const isRateLimitError = (error: any) => {
    return error?.message?.includes('#4') || 
           error?.message?.includes('Application request limit reached') ||
           error?.message?.includes('rate limit') ||
           error?.code === 4;
  };

  // Enhanced diagnostics with new validation method
  const runDiagnostics = async (accessToken: string): Promise<any> => {
    console.log('[META_ASSETS] Running enhanced diagnostics...');
    
    try {
      // Use the enhanced validation method
      const validation = await metaAdsAccountService.validateTokenAndPermissions(accessToken);
      
      console.log('[META_ASSETS] Enhanced diagnostics result:', {
        isValid: validation.isValid,
        hasEssentialPermissions: validation.hasEssentialPermissions,
        canAccessPages: validation.canAccessPages,
        canAccessInstagram: validation.canAccessInstagram,
        canAccessWhatsApp: validation.canAccessWhatsApp,
        issuesCount: validation.issues?.length || 0,
        needsReauthorization: validation.needsReauthorization
      });

      return validation;
    } catch (error) {
      console.error('[META_ASSETS] Enhanced diagnostics failed:', error);
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        grantedPermissions: [],
        permissionAnalysis: {},
        hasEssentialPermissions: false,
        canAccessPages: false,
        canAccessInstagram: false,
        canAccessWhatsApp: false,
        availableCategories: [],
        missingCategories: ['essential', 'pages', 'instagram', 'whatsapp'],
        issues: ['Erro ao executar diagnóstico'],
        recommendations: ['Verifique sua conexão e tente novamente'],
        needsReauthorization: true
      };
    }
  };

  // Main load function with enhanced diagnostics
  const loadAssets = async (forceLoad = false): Promise<LoadResult> => {
    // ✅ CACHE: Check cache first (unless force load)
    if (!forceLoad) {
      const cached = getCachedAssets();
      if (cached?.data) {
        console.log('[META_ASSETS] 📦 Using cached assets (30min TTL)');
        setAssets(cached.data.assets);
        setLastLoadResult(cached.data.result);
        return cached.data.result;
      }
    }

    if (!existingIntegration?.access_token) {
      console.log('[META_ASSETS] No integration found or access token missing');
      
      // Still load manual WhatsApp
      const manualWhatsApp = getManualWhatsAppNumbers();
      const manualWhatsAppAssets = manualWhatsApp.map(wa => ({
        id: wa.id,
        name: wa.name,
        type: 'whatsapp' as const,
        connected: true,
        phone: wa.phone,
        isManual: true
      }));
      
      setAssets(prev => ({
        ...prev,
        whatsapp: manualWhatsAppAssets
      }));

      const result: LoadResult = {
        success: false,
        pages: [],
        instagram: [],
        whatsapp: manualWhatsAppAssets,
        errors: ['No Meta integration found'],
        diagnostics: {
          tokenValid: false,
          permissions: []
        }
      };
      
      setLastLoadResult(result);
      return result;
    }

    // Prevent concurrent calls
    if (loadingRef.current) {
      console.log('[META_ASSETS] Load already in progress, skipping');
      return lastLoadResult || {
        success: false,
        pages: [],
        instagram: [],
        whatsapp: [],
        errors: ['Load in progress'],
        diagnostics: { tokenValid: false, permissions: [] }
      };
    }

    // Check rate limit unless forced
    if (!forceLoad && !shouldAttemptLoad()) {
      console.log('[META_ASSETS] Rate limit active, using cached data');
      return lastLoadResult || {
        success: false,
        pages: [],
        instagram: [],
        whatsapp: [],
        errors: ['Rate limit active'],
        diagnostics: { tokenValid: false, permissions: [] }
      };
    }

    loadingRef.current = true;
    setIsLoading(true);
    lastLoadTimeRef.current = Date.now();

    const result: LoadResult = {
      success: true,
      pages: [],
      instagram: [],
      whatsapp: [],
      errors: [],
      diagnostics: {
        tokenValid: false,
        permissions: []
      }
    };

    try {
      console.log('[META_ASSETS] Starting enhanced asset load...');
      
      // Run enhanced diagnostics first
      const diagnostics = await runDiagnostics(existingIntegration.access_token);
      result.diagnostics = diagnostics;

      if (!diagnostics.isValid) {
        throw new Error(`Token validation failed: ${diagnostics.error}`);
      }

      // Load manual WhatsApp first (always available)
      const manualWhatsApp = getManualWhatsAppNumbers();
      const manualWhatsAppAssets = manualWhatsApp.map(wa => ({
        id: wa.id,
        name: wa.name,
        type: 'whatsapp' as const,
        connected: true,
        phone: wa.phone,
        isManual: true
      }));

      // Load pages using enhanced permission check
      try {
        console.log('[META_ASSETS] Loading pages with enhanced permission check...');
        
        if (!diagnostics.canAccessPages) {
          throw new Error('Missing required permissions for pages');
        }

        const pagesData = await metaAdsAccountService.getPages(existingIntegration.access_token);
        console.log('[META_ASSETS] Pages loaded:', pagesData.length);
        
        // Store pages with tokens for Instagram loading
        pagesWithTokensRef.current = pagesData;
        
        result.pages = pagesData.map(page => ({
          id: page.id,
          name: page.name,
          type: 'page' as const,
          connected: true,
          category: page.category || 'Page',
          followers: page.fan_count || 0,
          pageAccessToken: page.access_token
        }));
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown pages error';
        console.error('[META_ASSETS] Error loading pages:', errorMsg);
        result.errors.push(`Pages: ${errorMsg}`);
        result.diagnostics.pagesError = errorMsg;
        
        if (isRateLimitError(error)) {
          result.success = false;
          throw error;
        }
      }

      // Load Instagram using enhanced permission check
      if (result.pages.length > 0 && diagnostics.canAccessInstagram) {
        try {
          console.log('[META_ASSETS] Loading Instagram with enhanced permission check...');
          
          const instagramPromises = result.pages.slice(0, 5).map(page => {
            const pageData = pagesWithTokensRef.current.find(p => p.id === page.id);
            if (!pageData?.access_token) {
              console.warn(`[META_ASSETS] No page access token for page ${page.id}`);
              return Promise.resolve([]);
            }
            return getInstagramAccountsForPage(page.id, pageData.access_token);
          });
          
          const instagramResults = await Promise.allSettled(instagramPromises);
          
          const successfulInstagramResults: MetaAsset[] = [];
          const failedCount = instagramResults.filter(result => {
            if (result.status === 'fulfilled') {
              successfulInstagramResults.push(...result.value);
              return false;
            }
            return true;
          }).length;
          
          result.instagram = successfulInstagramResults;
          console.log('[META_ASSETS] Instagram loaded:', result.instagram.length);
          
          if (failedCount > 0) {
            const instagramError = `Failed to load Instagram for ${failedCount} pages`;
            result.errors.push(`Instagram: ${instagramError}`);
            result.diagnostics.instagramError = instagramError;
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : 'Unknown Instagram error';
          console.error('[META_ASSETS] Error loading Instagram:', errorMsg);
          result.errors.push(`Instagram: ${errorMsg}`);
          result.diagnostics.instagramError = errorMsg;
        }
      } else if (!diagnostics.canAccessInstagram) {
        const noPermError = 'Instagram permissions not available';
        result.errors.push(`Instagram: ${noPermError}`);
        result.diagnostics.instagramError = noPermError;
      } else {
        const noPageError = 'No pages available for Instagram connection';
        result.errors.push(`Instagram: ${noPageError}`);
        result.diagnostics.instagramError = noPageError;
      }

      // Try to load WhatsApp from API using enhanced permission check
      let apiWhatsAppAssets: MetaAsset[] = [];
      try {
        if (diagnostics.canAccessWhatsApp) {
          console.log('[META_ASSETS] Loading WhatsApp Business accounts...');
          const whatsappData = await metaAdsAccountService.getWhatsAppBusinessAccounts(existingIntegration.access_token);
          console.log('[META_ASSETS] WhatsApp API loaded:', whatsappData.length);
          
          apiWhatsAppAssets = whatsappData.map(wa => ({
            id: wa.id,
            name: wa.name || wa.display_phone_number || wa.phone_number,
            type: 'whatsapp' as const,
            connected: true,
            phone: wa.display_phone_number || wa.phone_number,
            status: wa.status,
            isManual: false
          }));
        } else {
          console.log('[META_ASSETS] WhatsApp permissions not available');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown WhatsApp error';
        console.warn('[META_ASSETS] Error loading WhatsApp API:', errorMsg);
        result.errors.push(`WhatsApp API: ${errorMsg}`);
        result.diagnostics.whatsappError = errorMsg;
      }

      result.whatsapp = [...apiWhatsAppAssets, ...manualWhatsAppAssets];

      // Update state
      const newAssets = {
        pages: result.pages,
        instagram: result.instagram,
        whatsapp: result.whatsapp
      };

      setAssets(newAssets);
      setLastLoadResult(result);

      // ✅ CACHE: Save to cache on success
      setCachedAssets({
        assets: newAssets,
        result: result
      });

      console.log('[META_ASSETS] Enhanced load completed:', {
        success: result.success,
        pages: result.pages.length,
        instagram: result.instagram.length,
        whatsapp: result.whatsapp.length,
        errors: result.errors.length
      });

      // Show success/warning toast
      if (result.errors.length === 0) {
        toast({
          title: "Ativos carregados com sucesso!",
          description: `${result.pages.length} páginas, ${result.instagram.length} Instagram, ${result.whatsapp.length} WhatsApp`,
        });
      } else {
        toast({
          title: "Ativos carregados com avisos",
          description: `Alguns ativos podem não estar disponíveis. Verifique as permissões.`,
          variant: "destructive"
        });
      }

    } catch (error) {
      console.error('[META_ASSETS] Load error:', error);
      result.success = false;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      result.errors.push(errorMsg);
      
      if (isRateLimitError(error)) {
        console.log('[META_ASSETS] Rate limit detected, preserving existing assets');
      } else {
        toast({
          title: "Erro ao carregar ativos",
          description: errorMsg,
          variant: "destructive"
        });
      }
      
      setLastLoadResult(result);
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }

    return result;
  };

  // ✅ REMOVIDO auto-load: Apenas carrega manualmente via botão "Refresh" ou seletor
  useEffect(() => {
    // Only load manual WhatsApp from localStorage
    const manualWhatsApp = getManualWhatsAppNumbers();
    const manualWhatsAppAssets = manualWhatsApp.map(wa => ({
      id: wa.id,
      name: wa.name,
      type: 'whatsapp' as const,
      connected: true,
      phone: wa.phone,
      isManual: true
    }));

    setAssets(prev => ({
      ...prev,
      whatsapp: manualWhatsAppAssets
    }));

    // ✅ MUDANÇA: Tentar carregar do cache ao montar, mas NÃO fazer chamadas à API
    const cached = getCachedAssets();
    if (cached?.data) {
      console.log('[META_ASSETS] Loading from cache on mount');
      setAssets(cached.data.assets);
      setLastLoadResult(cached.data.result);
    }
  }, []);

  return {
    assets,
    isLoading,
    loadAssets: (forceLoad = false) => loadAssets(forceLoad),
    lastLoadResult,
    hasIntegration: !!existingIntegration,
    addManualWhatsApp,
    removeManualWhatsApp,
    getInstagramAccountsForPage,
    runDiagnostics: () => existingIntegration?.access_token ? runDiagnostics(existingIntegration.access_token) : Promise.resolve({ tokenValid: false, permissions: [] })
  };
};
