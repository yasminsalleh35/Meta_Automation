
import { useMetaAdsConnectionActions } from './useMetaAdsConnectionActions';
import { useMetaAdsPermissionActions } from './useMetaAdsPermissionActions';
import { useMetaAdsSaveActions } from './useMetaAdsSaveActions';

interface UseMetaAdsIntegrationActionsProps {
  accessToken: string;
  selectedAccounts: string[];
  selectedPages: string[];
  globalConfig: any;
  saveIntegration: (appId: string, appSecret: string, accessToken: string, selectedAccounts: string[], selectedPages: string[], businessManagerId?: string) => Promise<any>;
  refreshIntegration: () => Promise<any>;
  fetchAccountsAndPages: () => Promise<any>;
  validateCredentials: (appId?: string, appSecret?: string, permissionLevel?: 'required') => Promise<any>;
  requestAdvancedPermissions: () => Promise<any>;
  setAccessToken: (token: string) => void;
  setCurrentStep: (step: 'connect' | 'permissions' | 'accounts' | 'connected') => void;
  setSelectedAccounts: (accounts: string[]) => void;
  setSelectedPages: (pages: string[]) => void;
}

export const useMetaAdsIntegrationActions = ({
  accessToken,
  selectedAccounts,
  selectedPages,
  globalConfig,
  saveIntegration,
  refreshIntegration,
  fetchAccountsAndPages,
  validateCredentials,
  requestAdvancedPermissions,
  setAccessToken,
  setCurrentStep,
  setSelectedAccounts,
  setSelectedPages
}: UseMetaAdsIntegrationActionsProps) => {
  const connectionActions = useMetaAdsConnectionActions({
    globalConfig,
    validateCredentials,
    fetchAccountsAndPages,
    setAccessToken,
    setCurrentStep,
    setSelectedAccounts,
    setSelectedPages
  });

  const permissionActions = useMetaAdsPermissionActions({
    requestAdvancedPermissions,
    fetchAccountsAndPages,
    setAccessToken
  });

  const saveActions = useMetaAdsSaveActions({
    accessToken,
    selectedAccounts,
    selectedPages,
    globalConfig,
    saveIntegration,
    refreshIntegration,
    setCurrentStep
  });

  return {
    handleConnect: connectionActions.handleConnect,
    handleRequestAdvanced: permissionActions.handleRequestAdvanced,
    handleSaveIntegration: saveActions.handleSaveIntegration
  };
};
