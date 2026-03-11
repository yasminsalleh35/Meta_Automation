
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Info } from 'lucide-react';
import MetaAdsConnectionStep from './MetaAdsConnectionStep';
import MetaAdsPermissionStatus from './MetaAdsPermissionStatus';
import { MetaAdsAccountSelectionStep } from './MetaAdsAccountSelectionStep';
import MetaAdsConnectedStep from './MetaAdsConnectedStep';
import MetaServiceExplanation from '@/components/demo/MetaServiceExplanation';
import { useI18n } from '@/contexts/I18nContext';

interface MetaAdsIntegrationStepsProps {
  currentStep: 'connect' | 'permissions' | 'accounts' | 'connected';
  setCurrentStep: (step: 'connect' | 'permissions' | 'accounts' | 'connected') => void;
  isLoading: boolean;
  currentPermissions: string[];
  permissionLevels: any;
  adAccounts: any[];
  pages: any[];
  selectedAccounts: string[];
  selectedPages: string[];
  onAccountToggle: (accountId: string) => void;
  onPageToggle: (pageId: string) => void;
  onConnect: () => void;
  onRequestAdvanced: () => void;
  onSaveIntegration: () => void;
  onDisconnectIntegration?: () => void;
  refreshIntegration: () => Promise<any>;
}

const MetaAdsIntegrationSteps: React.FC<MetaAdsIntegrationStepsProps> = ({
  currentStep,
  setCurrentStep,
  isLoading,
  currentPermissions,
  permissionLevels,
  adAccounts,
  pages,
  selectedAccounts,
  selectedPages,
  onAccountToggle,
  onPageToggle,
  onConnect,
  onRequestAdvanced,
  onSaveIntegration,
  onDisconnectIntegration,
  refreshIntegration
}) => {
  const { t } = useI18n();

  const renderStep = () => {
    switch (currentStep) {
      case 'connect':
        return (
          <MetaServiceExplanation service="ads_management">
            <MetaAdsConnectionStep
              onConnect={onConnect}
              isLoading={isLoading}
            />
          </MetaServiceExplanation>
        );

      case 'permissions':
        return (
          <div className="space-y-4">
            <Alert className="border-blue-200 bg-blue-50">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>{t('meta.integration.connected')}!</strong> Agora buscando suas contas e páginas...
              </AlertDescription>
            </Alert>
            
            <MetaServiceExplanation service="pages_show_list">
              <MetaAdsPermissionStatus
                grantedPermissions={currentPermissions}
                permissionLevels={permissionLevels}
                onRequestAdvanced={onRequestAdvanced}
                isLoading={isLoading}
              />
            </MetaServiceExplanation>
          </div>
        );

      case 'accounts':
        return (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <Info className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Quase pronto!</strong> Selecione as contas e páginas. A integração será salva automaticamente.
              </AlertDescription>
            </Alert>
            
            <MetaServiceExplanation service="pages_read_engagement">
              <MetaAdsPermissionStatus
                grantedPermissions={currentPermissions}
                permissionLevels={permissionLevels}
                onRequestAdvanced={onRequestAdvanced}
                isLoading={isLoading}
              />
            </MetaServiceExplanation>
            
            <MetaServiceExplanation service="whatsapp_business_management">
              <MetaAdsAccountSelectionStep
                adAccounts={adAccounts}
                pages={pages}
                selectedAccounts={selectedAccounts}
                selectedPages={selectedPages}
                onAccountToggle={onAccountToggle}
                onPageToggle={onPageToggle}
                onConnect={onSaveIntegration}
                isLoading={isLoading}
              />
            </MetaServiceExplanation>
          </div>
        );

      case 'connected':
        return (
          <MetaAdsConnectedStep
            currentPermissions={currentPermissions}
            permissionLevels={permissionLevels}
            onRequestAdvanced={onRequestAdvanced}
            onReconfigure={() => setCurrentStep('connect')}
            onDisconnect={onDisconnectIntegration}
            onRefresh={refreshIntegration}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  return <>{renderStep()}</>;
};

export default MetaAdsIntegrationSteps;
