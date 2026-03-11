
import { useMetaAdsAuth } from './useMetaAdsAuth';
import { useMetaAdsData } from './useMetaAdsData';
import { useMetaAdsIntegrationManager } from './useMetaAdsIntegrationManager';
import { useMetaAdsTokenCompatibility } from './useMetaAdsTokenCompatibility';
import { useState, useEffect } from 'react';

export const useMetaAdsIntegration = () => {
  const auth = useMetaAdsAuth();
  const data = useMetaAdsData();
  const integration = useMetaAdsIntegrationManager();
  const [existingIntegration, setExistingIntegration] = useState<any>(null);
  const [isCheckingIntegration, setIsCheckingIntegration] = useState(true);

  // ✅ FASE 1.2: Token validation is MANUAL only (enabled: false)
  const compatibility = useMetaAdsTokenCompatibility(
    existingIntegration?.access_token,
    false  // ← Manual validation only
  );

  // Check for existing integration on mount
  useEffect(() => {
    const checkIntegration = async () => {
      setIsCheckingIntegration(true);
      try {
        const existing = await integration.checkExistingIntegration();
        
        // ✅ FIXED: Normalize integration data to ensure consistency
        if (existing) {
          const normalizedIntegration = {
            ...existing,
            // Use array data as fallback when direct fields are null
            ad_account_id: existing.ad_account_id || (existing.selected_accounts?.[0] || null),
            page_id: existing.page_id || (existing.selected_pages?.[0] || null)
          };
          
          console.log('🔧 Integration data normalized:', {
            original: existing,
            normalized: normalizedIntegration,
            hasAdAccount: !!normalizedIntegration.ad_account_id,
            hasPage: !!normalizedIntegration.page_id
          });
          
          setExistingIntegration(normalizedIntegration);
        } else {
          setExistingIntegration(null);
        }
      } catch (error) {
        console.error('Error checking existing integration:', error);
        setExistingIntegration(null);
      } finally {
        setIsCheckingIntegration(false);
      }
    };

    checkIntegration();
  }, []);

  const handleForceReconnection = async () => {
    try {
      await integration.forceReconnection();
      // Refresh integration after forced disconnection
      const updated = await integration.checkExistingIntegration();
      
      // Apply same normalization to refreshed data
      if (updated) {
        const normalizedUpdated = {
          ...updated,
          ad_account_id: updated.ad_account_id || (updated.selected_accounts?.[0] || null),
          page_id: updated.page_id || (updated.selected_pages?.[0] || null)
        };
        setExistingIntegration(normalizedUpdated);
      } else {
        setExistingIntegration(null);
      }
    } catch (error) {
      console.error('Error forcing reconnection:', error);
    }
  };

  return {
    // Auth state and methods
    isLoading: auth.isLoading || data.isLoading || isCheckingIntegration || compatibility.isChecking,
    validateCredentials: auth.validateCredentials,
    
    // Data state and methods
    adAccounts: data.adAccounts,
    pages: data.pages,
    fetchAccountsAndPages: data.fetchAccountsAndPages,
    
    // Integration management methods
    saveIntegration: async (
      appId: string,
      appSecret: string,
      accessToken: string,
      selectedAccounts: string[],
      selectedPages: any[], // Fixed: Changed from string[] to any[] to accept MetaPage objects
      businessManagerId?: string
    ) => {
      const result = await integration.saveIntegration(
        appId,
        appSecret,
        accessToken,
        selectedAccounts,
        selectedPages,
        businessManagerId
      );
      // Refresh existing integration after save with normalization
      const updated = await integration.checkExistingIntegration();
      if (updated) {
        const normalizedUpdated = {
          ...updated,
          ad_account_id: updated.ad_account_id || (updated.selected_accounts?.[0] || null),
          page_id: updated.page_id || (updated.selected_pages?.[0] || null)
        };
        setExistingIntegration(normalizedUpdated);
      }
      return result;
    },
    checkExistingIntegration: integration.checkExistingIntegration,
    existingIntegration,
    refreshIntegration: async () => {
      const updated = await integration.checkExistingIntegration();
      if (updated) {
        const normalizedUpdated = {
          ...updated,
          ad_account_id: updated.ad_account_id || (updated.selected_accounts?.[0] || null),
          page_id: updated.page_id || (updated.selected_pages?.[0] || null)
        };
        setExistingIntegration(normalizedUpdated);
        return normalizedUpdated;
      }
      setExistingIntegration(null);
      return null;
    },

    // Token compatibility
    tokenCompatibility: compatibility,
    isTokenIncompatible: compatibility.needsReconnection,
    forceReconnection: handleForceReconnection,
    
    // Legacy compatibility flags
    hasTokenIncompatibility: existingIntegration?._tokenIncompatible || false,
    compatibilityError: existingIntegration?._compatibilityError
  };
};
