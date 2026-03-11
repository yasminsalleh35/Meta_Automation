
import React from 'react';

interface MetaAdsIntegrationHandlersProps {
  selectedAccounts: string[];
  setSelectedAccounts: React.Dispatch<React.SetStateAction<string[]>>;
  selectedPages: string[];
  setSelectedPages: React.Dispatch<React.SetStateAction<string[]>>;
}

export const useMetaAdsIntegrationHandlers = ({
  selectedAccounts,
  setSelectedAccounts,
  selectedPages,
  setSelectedPages
}: MetaAdsIntegrationHandlersProps) => {
  const handleAccountToggle = (accountId: string) => {
    setSelectedAccounts(prev => {
      const updated = prev.includes(accountId) 
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId];
      
      console.log('📊 Account selection updated:', {
        accountId,
        previousCount: prev.length,
        newCount: updated.length,
        selected: updated
      });
      
      return updated;
    });
  };

  const handlePageToggle = (pageId: string) => {
    setSelectedPages(prev => {
      const updated = prev.includes(pageId) 
        ? prev.filter(id => id !== pageId)
        : [...prev, pageId];
      
      console.log('📄 Page selection updated:', {
        pageId,
        previousCount: prev.length,
        newCount: updated.length,
        selected: updated
      });
      
      return updated;
    });
  };

  const handleForceReconnection = async (forceReconnection: () => Promise<void>, setCurrentStep: (step: 'connect' | 'permissions' | 'accounts' | 'connected') => void, setAccessToken: (token: string) => void) => {
    try {
      console.log('🔄 Force reconnection initiated');
      await forceReconnection();
      setCurrentStep('connect');
      
      // Limpar estados locais
      setAccessToken('');
      setSelectedAccounts([]);
      setSelectedPages([]);
    } catch (error) {
      console.error('❌ Error handling force reconnection:', error);
    }
  };

  return {
    handleAccountToggle,
    handlePageToggle,
    handleForceReconnection
  };
};
