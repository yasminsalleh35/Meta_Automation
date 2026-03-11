
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface MetaAdsIntegrationDebugProps {
  currentStep: string;
  accessToken: string;
  selectedAccounts: string[];
  selectedPages: string[];
  existingIntegration: any;
  isTokenIncompatible: boolean;
}

const MetaAdsIntegrationDebug: React.FC<MetaAdsIntegrationDebugProps> = ({
  currentStep,
  accessToken,
  selectedAccounts,
  selectedPages,
  existingIntegration,
  isTokenIncompatible
}) => {
  if (process.env.NODE_ENV !== 'development') return null;
  
  return (
    <Alert className="border-gray-200 bg-gray-50 mb-4">
      <Info className="h-4 w-4" />
      <AlertDescription className="text-xs">
        <strong>Debug:</strong> Step: {currentStep} | Token: {accessToken ? '✅' : '❌'} | 
        Accounts: {selectedAccounts.length} | Pages: {selectedPages.length} | 
        Integration: {existingIntegration?.status || 'none'} | 
        Compatible: {isTokenIncompatible ? '❌' : '✅'}
      </AlertDescription>
    </Alert>
  );
};

export default MetaAdsIntegrationDebug;
