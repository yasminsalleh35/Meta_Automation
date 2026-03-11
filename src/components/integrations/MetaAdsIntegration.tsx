
import React, { useState, useEffect, useCallback } from 'react';
import { useMetaAdsIntegrationState } from '@/hooks/useMetaAdsIntegrationState';
import { useMetaAdsIntegrationActions } from '@/hooks/useMetaAdsIntegrationActions';
import { useMetaAdsIntegrationHandlers } from './MetaAdsIntegrationHandlers';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import MetaAdsConnectionStep from './MetaAdsConnectionStep';
import MetaAdsConnectedStep from './MetaAdsConnectedStep';
import { PostAuthAssetSelector } from './PostAuthAssetSelector';
import { IntegrationStatusCard } from './IntegrationStatusCard';
import { debounce } from '@/lib/debounce';

interface MetaAdsIntegrationProps {
  onConnectionChange?: (connected: boolean) => void;
  isConnected?: boolean;
}

const MetaAdsIntegration: React.FC<MetaAdsIntegrationProps> = ({
  onConnectionChange,
  isConnected = false
}) => {
  const [showAssetSelector, setShowAssetSelector] = useState(false);
  const [pendingIntegrationId, setPendingIntegrationId] = useState<string>('');
  const [whatsappAssets, setWhatsappAssets] = useState<any[]>([]);
  const {
    currentStep,
    setCurrentStep,
    accessToken,
    setAccessToken,
    selectedAccounts,
    setSelectedAccounts,
    selectedPages,
    setSelectedPages,
    isLoading,
    existingIntegration,
    adAccounts,
    pages,
    currentPermissions,
    permissionLevels,
    globalConfig,
    configLoading,
    refreshIntegration,
    fetchAccountsAndPages,
    saveIntegration,
    validateCredentials,
    requestAdvancedPermissions,
    disconnectIntegration,
    tokenCompatibility,
    isTokenIncompatible,
    forceReconnection,
    hasTokenIncompatibility,
    compatibilityError
  } = useMetaAdsIntegrationState();

  // Listen for OAuth success messages
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      
      if (event.data.type === 'META_AUTH_SUCCESS_WITH_ASSETS') {
        console.log('🎯 Received OAuth success, showing asset selector...');
        
        // ✅ Consumir whatsappAssets do payload
        const assets = event.data.data.whatsappAssets ?? [];
        console.log('📱 WhatsApp Assets received:', { count: assets.length, assets });
        setWhatsappAssets(assets);
        
        setShowAssetSelector(true);
        setPendingIntegrationId(event.data.data.integrationId || '');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // ✅ FASE 2.3: Debounced connection status updates (500ms)
  const debouncedConnectionChange = useCallback(
    debounce((connected: boolean) => {
      console.log('🔄 Connection status update (debounced):', connected);
      onConnectionChange?.(connected);
    }, 500),
    [onConnectionChange]
  );

  useEffect(() => {
    // ✅ CORREÇÃO 5: Desabilitar durante OAuth para evitar interrupção do save-asset-selection
    if (showAssetSelector) {
      console.log('⏸️ OAuth in progress - debounced connection change disabled');
      return;
    }
    const isConnectedNow = existingIntegration?.status === 'active' && !isTokenIncompatible;
    debouncedConnectionChange(isConnectedNow);
  }, [existingIntegration?.status, isTokenIncompatible, debouncedConnectionChange, showAssetSelector]);

  const { handleAccountToggle, handlePageToggle, handleForceReconnection } = useMetaAdsIntegrationHandlers({
    selectedAccounts,
    setSelectedAccounts,
    selectedPages,
    setSelectedPages
  });

  const actions = useMetaAdsIntegrationActions({
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
  });

  const handleForceReconnectionClick = async () => {
    await handleForceReconnection(forceReconnection, setCurrentStep, setAccessToken);
  };

  const handleAssetSelectorComplete = () => {
    setShowAssetSelector(false);
    setPendingIntegrationId('');
    refreshIntegration(); // Refresh to show updated status
    
    // Redirect to success page
    window.location.href = '/dashboard/integrations/meta-success';
  };

  // ✅ FASE 5.1: Consistent loading skeleton
  const isInitializing = configLoading || tokenCompatibility.isChecking;
  
  if (isInitializing) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Mostrar erro APENAS se não estiver loading E não tiver config
  if (!globalConfig?.appId || !globalConfig?.appSecret) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Configuração necessária:</strong> Entre em contato com o suporte para ativar a integração.
        </AlertDescription>
      </Alert>
    );
  }

  // Show token compatibility issue
  if (isTokenIncompatible || hasTokenIncompatibility) {
    return (
      <Alert className="border-orange-200 bg-orange-50">
        <AlertTriangle className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800 space-y-3">
          <div>
            <strong>Reconexão necessária</strong>
            <p className="text-sm mt-1">
              Sua conexão com Meta Ads precisa ser atualizada.
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleForceReconnectionClick}
            disabled={isLoading}
            className="border-orange-300 text-orange-800 hover:bg-orange-100"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                Reconectando...
              </>
            ) : (
              'Reconectar agora'
            )}
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  const isCurrentlyConnected = existingIntegration?.status === 'active' && !isTokenIncompatible;

  return (
    <>
      <div className="space-y-4">
        {isCurrentlyConnected ? (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Meta Ads conectado!</strong> Sua integração está ativa e funcionando.
              </AlertDescription>
            </Alert>

            <IntegrationStatusCard />

            <MetaAdsConnectedStep
              currentPermissions={currentPermissions}
              permissionLevels={permissionLevels}
              onRequestAdvanced={actions.handleRequestAdvanced}
              onReconfigure={() => setCurrentStep('connect')}
              onDisconnect={disconnectIntegration}
              onRefresh={refreshIntegration}
              isLoading={isLoading}
            />
          </div>
        ) : (
          <MetaAdsConnectionStep
            onConnect={actions.handleConnect}
            isLoading={isLoading}
          />
        )}
      </div>

      <PostAuthAssetSelector
        isOpen={showAssetSelector}
        onClose={() => setShowAssetSelector(false)}
        onComplete={handleAssetSelectorComplete}
        integrationId={pendingIntegrationId}
      />
    </>
  );
};

export default MetaAdsIntegration;
