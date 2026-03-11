
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Settings, RefreshCw, LogOut, Shield } from 'lucide-react';
import MetaAdsPermissionStatus from './MetaAdsPermissionStatus';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';

interface MetaAdsConnectedStepProps {
  currentPermissions: string[];
  permissionLevels: any;
  onRequestAdvanced: () => void;
  onReconfigure: () => void;
  onRefresh: () => Promise<any>;
  onDisconnect?: () => void;
  isLoading: boolean;
}

const MetaAdsConnectedStep: React.FC<MetaAdsConnectedStepProps> = ({
  currentPermissions,
  permissionLevels,
  onRequestAdvanced,
  onReconfigure,
  onRefresh,
  onDisconnect,
  isLoading
}) => {
  // ✅ FASE 5.2: Access token compatibility hook for manual validation
  const { tokenCompatibility } = useMetaAdsIntegration();

  const handleValidateToken = async () => {
    await tokenCompatibility.validateCompatibility();
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center text-green-700">
            <CheckCircle className="w-5 h-5 mr-2" />
            Meta Ads Conectado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Status da Integração</h4>
              <p className="text-sm text-gray-600">
                Sua conta Meta Ads está conectada e funcionando
              </p>
            </div>
            <Badge className="bg-green-500">
              <CheckCircle className="w-3 h-3 mr-1" />
              Ativo
            </Badge>
          </div>

          <MetaAdsPermissionStatus
            grantedPermissions={currentPermissions}
            permissionLevels={permissionLevels}
            onRequestAdvanced={onRequestAdvanced}
            isLoading={isLoading}
          />

          {/* ✅ FASE 5.2: Manual "Validate Token" button with loading states */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleValidateToken}
              disabled={isLoading || tokenCompatibility.isChecking}
              className="flex-1"
            >
              {tokenCompatibility.isChecking ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <Shield className="w-4 h-4 mr-2" />
                  Validar Token
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={onRefresh}
              disabled={isLoading}
              className="flex-1"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            
            <Button
              variant="outline"
              onClick={onReconfigure}
              disabled={isLoading}
              className="flex-1"
            >
              <Settings className="w-4 h-4 mr-2" />
              Reconfigurar
            </Button>

            {onDisconnect && (
              <Button
                variant="destructive"
                onClick={onDisconnect}
                disabled={isLoading}
                className="flex-1"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Desconectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetaAdsConnectedStep;
