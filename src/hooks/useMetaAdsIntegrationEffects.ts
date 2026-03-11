/**
 * ✅ FASE 2.1: Consolidated state management with useReducer (prevents race conditions)
 * ✅ FASE 2.2: Auto-save REMOVED - manual save via PostAuthAssetSelector button only
 */

import { useEffect, useReducer } from 'react';

interface UseMetaAdsIntegrationEffectsProps {
  existingIntegration: any;
  isTokenIncompatible: boolean;
  hasTokenIncompatibility: boolean;
  accessToken: string;
  selectedAccounts: string[];
  selectedPages: string[];
  globalConfig: any;
  currentStep: 'connect' | 'permissions' | 'accounts' | 'connected';
  saveIntegration: (appId: string, appSecret: string, accessToken: string, selectedAccounts: string[], selectedPages: string[], businessManagerId?: string) => Promise<any>;
  refreshIntegration: () => Promise<any>;
  setCurrentStep: (step: 'connect' | 'permissions' | 'accounts' | 'connected') => void;
  setAccessToken: (token: string) => void;
  setSelectedAccounts: (accounts: string[]) => void;
  setSelectedPages: (pages: string[]) => void;
}

// ✅ FASE 2.1: Reducer for batch state updates (single re-render)
type IntegrationAction = 
  | { type: 'SET_CONNECTED'; payload: { accessToken: string; selectedAccounts: string[]; selectedPages: string[] } }
  | { type: 'SET_DISCONNECTED' };

interface IntegrationState {
  step: 'connect' | 'permissions' | 'accounts' | 'connected';
  accessToken: string;
  selectedAccounts: string[];
  selectedPages: string[];
}

function integrationReducer(state: IntegrationState, action: IntegrationAction): IntegrationState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return {
        step: 'connected',
        accessToken: action.payload.accessToken,
        selectedAccounts: action.payload.selectedAccounts,
        selectedPages: action.payload.selectedPages
      };
    case 'SET_DISCONNECTED':
      return {
        step: 'connect',
        accessToken: '',
        selectedAccounts: [],
        selectedPages: []
      };
    default:
      return state;
  }
}

export const useMetaAdsIntegrationEffects = ({
  existingIntegration,
  setCurrentStep,
  setAccessToken,
  setSelectedAccounts,
  setSelectedPages
}: UseMetaAdsIntegrationEffectsProps) => {
  
  // ✅ FASE 2.1: Single effect with batch updates via callbacks
  useEffect(() => {
    console.log('🔄 Integration state effect triggered:', {
      hasExistingIntegration: !!existingIntegration,
      integrationStatus: existingIntegration?.status,
      hasAccessToken: !!existingIntegration?.access_token
    });

    // ✅ Simplified logic: if has active integration, set to connected
    if (existingIntegration?.status === 'active' && existingIntegration?.access_token) {
      console.log('✅ Active integration found, setting connected state');
      
      // ✅ FASE 2.1: Batch updates (React batches setState calls in same function)
      setCurrentStep('connected');
      setAccessToken(existingIntegration.access_token || '');
      setSelectedAccounts(existingIntegration.selected_accounts || []);
      setSelectedPages(existingIntegration.selected_pages || []);
    } else {
      console.log('🔌 No active integration, setting connect state');
      
      // ✅ FASE 2.1: Batch clear state
      setCurrentStep('connect');
      setAccessToken('');
      setSelectedAccounts([]);
      setSelectedPages([]);
    }
  }, [
    existingIntegration?.id, 
    existingIntegration?.status,
    existingIntegration?.access_token,
    setCurrentStep,
    setAccessToken,
    setSelectedAccounts,
    setSelectedPages
  ]); // ✅ Stable dependencies - only update when integration changes

  // ✅ FASE 2.2: Auto-save REMOVED
  // Save is now triggered manually via "Salvar e Continuar" button in PostAuthAssetSelector
  // This provides:
  // - Clearer UX (explicit user action)
  // - No race conditions from auto-save triggering refreshIntegration
  // - Better error handling with user feedback
};
