
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface MetaAdsConfigAlertProps {
  configLoading: boolean;
  globalConfig: any;
}

const MetaAdsConfigAlert: React.FC<MetaAdsConfigAlertProps> = ({
  configLoading,
  globalConfig
}) => {
  if (configLoading || (globalConfig && globalConfig.appId && globalConfig.appSecret)) {
    return null;
  }

  return (
    <Alert className="border-red-200 bg-red-50">
      <AlertCircle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800">
        <strong>Configuração necessária:</strong> As configurações globais do Meta Ads não foram encontradas. 
        Entre em contato com o administrador para configurar o App ID e App Secret.
      </AlertDescription>
    </Alert>
  );
};

export default MetaAdsConfigAlert;
