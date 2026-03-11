import React, { createContext, useContext } from 'react';
import { useUnifiedMetaAssets } from '@/hooks/useUnifiedMetaAssets';

interface MetaAssetsContextType {
  // Facebook Pages & Instagram
  facebookPages: any[];
  instagramAccounts: any[];
  assetsLoading: boolean;
  assetsError: string | null;
  
  // Ad Accounts
  adAccounts: any[];
  adAccountsLoading: boolean;
  
  // Shared fetch function with deduplication
  fetchAllAssets: (forceRefresh?: boolean) => Promise<void>;
  
  // Clear cache and refetch
  clearCacheAndRefetch: () => Promise<void>;
  
  // Retry info
  retryCount: number;
}

const MetaAssetsContext = createContext<MetaAssetsContextType | undefined>(undefined);

export const useMetaAssetsContext = () => {
  const context = useContext(MetaAssetsContext);
  if (!context) {
    throw new Error('useMetaAssetsContext must be used within MetaAssetsProvider');
  }
  return context;
};

export const MetaAssetsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // ✅ FASE 2: Usar hook unificado ao invés de múltiplos hooks
  const {
    adAccounts,
    facebookPages,
    instagramAccounts,
    isLoading,
    error,
    fetchAllAssets,
    clearCacheAndRefetch,
    retryCount
  } = useUnifiedMetaAssets();

  // ✅ FASE 3: Carregar ativos apenas UMA VEZ no mount (backend tem cache de 24h)
  React.useEffect(() => {
    console.log('[MetaAssetsContext] Mounting - loading cached assets once');
    fetchAllAssets(); // Vai buscar do cache do DB (instantâneo)
  }, []); // Apenas no mount

  const value: MetaAssetsContextType = {
    facebookPages,
    instagramAccounts,
    assetsLoading: isLoading,
    assetsError: error,
    adAccounts,
    adAccountsLoading: isLoading,
    fetchAllAssets,
    clearCacheAndRefetch,
    retryCount
  };

  return (
    <MetaAssetsContext.Provider value={value}>
      {children}
    </MetaAssetsContext.Provider>
  );
};