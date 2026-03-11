
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface MetaAdsCompatibilityAlertProps {
  isIncompatible: boolean;
  tokenAppId?: string;
  configuredAppId?: string;
  error?: string;
  isProcessing?: boolean;
  onForceReconnection: () => void;
  onDismiss?: () => void;
}

const MetaAdsCompatibilityAlert: React.FC<MetaAdsCompatibilityAlertProps> = ({
  isIncompatible,
  tokenAppId,
  configuredAppId,
  error,
  isProcessing = false,
  onForceReconnection,
  onDismiss
}) => {
  if (!isIncompatible) return null;

  return (
    <Alert className="border-orange-200 bg-orange-50 mb-4">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="text-orange-800">
        <div className="space-y-3">
          <div>
            <strong>⚠️ Token incompatível detectado</strong>
            <p className="text-sm mt-1">
              Seu token foi gerado por um aplicativo anterior e não é compatível com a configuração atual.
            </p>
          </div>
          
          {tokenAppId && configuredAppId && (
            <div className="text-xs bg-orange-100 p-2 rounded border">
              <p><strong>Token App ID:</strong> {tokenAppId}</p>
              <p><strong>App Configurado:</strong> {configuredAppId}</p>
            </div>
          )}
          
          {error && (
            <div className="text-xs text-orange-700 italic">
              {error}
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={onForceReconnection}
              disabled={isProcessing}
              className="border-orange-300 text-orange-800 hover:bg-orange-100"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" />
                  Invalidando...
                </>
              ) : (
                'Invalidar e Reconectar'
              )}
            </Button>
            
            {onDismiss && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDismiss}
                className="text-orange-600 hover:text-orange-800"
              >
                Ignorar
              </Button>
            )}
          </div>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default MetaAdsCompatibilityAlert;
