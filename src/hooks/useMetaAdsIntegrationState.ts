
import { useState, useEffect } from 'react';
import { useMetaAdsIntegration } from './useMetaAdsIntegration';
import { useGlobalMetaConfig } from './useGlobalMetaConfig';
import { useMetaAdsAuth } from './useMetaAdsAuth';
import { useMetaAdsData } from './useMetaAdsData';
import { useMetaAdsIntegrationManager } from './useMetaAdsIntegrationManager';
import { useMetaAdsIntegrationEffects } from './useMetaAdsIntegrationEffects';

export const useMetaAdsIntegrationState = () => {
  // States
  const [currentStep, setCurrentStep] = useState<'connect' | 'permissions' | 'accounts' | 'connected'>('connect');
  const [accessToken, setAccessToken] = useState('');
  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);
  const [selectedPages, setSelectedPages] = useState<string[]>([]);

  // Hooks
  const {
    existingIntegration,
    refreshIntegration,
    isTokenIncompatible,
    forceReconnection,
    hasTokenIncompatibility,
    compatibilityError,
    tokenCompatibility
  } = useMetaAdsIntegration();

  const { config: globalConfig, loading: configLoading } = useGlobalMetaConfig();
  
  const {
    isLoading: authLoading,
    currentPermissions,
    permissionLevels,
    validateCredentials,
    requestAdvancedPermissions
  } = useMetaAdsAuth();

  const {
    adAccounts,
    pages,
    fetchAccountsAndPages,
    isLoading: dataLoading
  } = useMetaAdsData();

  const {
    saveIntegration,
    disconnectIntegration,
    isProcessing
  } = useMetaAdsIntegrationManager();

  const isLoading = authLoading || dataLoading || isProcessing;

  // Handle disconnection with proper state reset
  const handleDisconnectIntegration = async () => {
    try {
      console.log('🔌 Handling integration disconnection...');
      
      // Disconnect from database
      await disconnectIntegration();
      
      // Reset all local states
      setCurrentStep('connect');
      setAccessToken('');
      setSelectedAccounts([]);
      setSelectedPages([]);
      
      // Refresh integration state
      await refreshIntegration();
      
      console.log('✅ Integration disconnection completed');
    } catch (error) {
      console.error('❌ Error disconnecting integration:', error);
    }
  };

  // Effects for auto-save and state management
  useMetaAdsIntegrationEffects({
    existingIntegration,
    isTokenIncompatible,
    hasTokenIncompatibility,
    accessToken,
    selectedAccounts,
    selectedPages,
    globalConfig,
    currentStep,
    saveIntegration,
    refreshIntegration,
    setCurrentStep,
    setAccessToken,
    setSelectedAccounts,
    setSelectedPages
  });

  return {
    // State
    currentStep,
    setCurrentStep,
    accessToken,
    setAccessToken,
    selectedAccounts,
    setSelectedAccounts,
    selectedPages,
    setSelectedPages,
    isLoading,

    // Integration data
    existingIntegration,
    adAccounts,
    pages,
    currentPermissions,
    permissionLevels,
    globalConfig,
    configLoading,

    // Actions
    refreshIntegration,
    fetchAccountsAndPages,
    saveIntegration,
    validateCredentials,
    requestAdvancedPermissions,
    disconnectIntegration: handleDisconnectIntegration,

    // Token compatibility
    tokenCompatibility,
    isTokenIncompatible,
    forceReconnection,
    hasTokenIncompatibility,
    compatibilityError
  };
};
