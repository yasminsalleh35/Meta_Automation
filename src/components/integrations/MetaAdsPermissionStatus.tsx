
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, Lock, Unlock, Zap } from 'lucide-react';

interface PermissionStatusProps {
  grantedPermissions: string[];
  permissionLevels: any;
  onRequestAdvanced: () => void;
  isLoading: boolean;
}

const MetaAdsPermissionStatus: React.FC<PermissionStatusProps> = ({
  grantedPermissions,
  permissionLevels,
  onRequestAdvanced,
  isLoading
}) => {
  // Safety checks to prevent undefined errors
  const basicScopes = permissionLevels?.basic?.scopes || [];
  const advancedScopes = permissionLevels?.advanced?.scopes || [];
  
  const hasBasicPermissions = basicScopes.length > 0 && basicScopes.some((scope: string) => 
    grantedPermissions.includes(scope)
  );
  
  const hasAdvancedPermissions = advancedScopes.length > 0 && advancedScopes.every((scope: string) => 
    grantedPermissions.includes(scope)
  );

  const getPermissionIcon = (permission: string) => {
    const isGranted = grantedPermissions.includes(permission);
    return isGranted ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <AlertCircle className="w-4 h-4 text-gray-400" />;
  };

  const getPermissionStatus = (scopes: string[]) => {
    const granted = scopes.filter(scope => grantedPermissions.includes(scope)).length;
    const total = scopes.length;
    return { granted, total, percentage: Math.round((granted / total) * 100) };
  };

  const basicStatus = getPermissionStatus(basicScopes);
  const advancedStatus = getPermissionStatus(advancedScopes);

  // If permissionLevels is not properly loaded, show loading state
  if (!permissionLevels?.basic || !permissionLevels?.advanced) {
    return (
      <Alert className="border-gray-200 bg-gray-50">
        <AlertCircle className="h-4 w-4 text-gray-600" />
        <AlertDescription className="text-gray-800">
          Carregando informações de permissões...
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Current Status Alert */}
      {hasAdvancedPermissions ? (
        <Alert className="border-green-200 bg-green-50">
          <Zap className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Permissões Completas:</strong> Você tem acesso total a todas as funcionalidades do Meta Ads.
          </AlertDescription>
        </Alert>
      ) : hasBasicPermissions ? (
        <Alert className="border-blue-200 bg-blue-50">
          <Unlock className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>Permissões Básicas:</strong> Algumas funcionalidades podem estar limitadas. Solicite permissões avançadas para acesso completo.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="border-red-200 bg-red-50">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Sem Permissões:</strong> Configure a integração para começar a usar o Meta Ads.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Permissões Básicas</span>
              <Badge variant={basicStatus.granted > 0 ? 'default' : 'secondary'}>
                {basicStatus.granted}/{basicStatus.total}
              </Badge>
            </CardTitle>
            <CardDescription>
              Funcionalidades básicas de páginas e visualização
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {basicScopes.map((permission: string) => (
                <div key={permission} className="flex items-center space-x-2">
                  {getPermissionIcon(permission)}
                  <span className="text-sm">{permission}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Advanced Permissions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>Permissões Avançadas</span>
              <Badge variant={hasAdvancedPermissions ? 'default' : 'secondary'}>
                {advancedStatus.granted}/{advancedStatus.total}
              </Badge>
            </CardTitle>
            <CardDescription>
              Criação de campanhas e insights avançados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              {advancedScopes.map((permission: string) => (
                <div key={permission} className="flex items-center space-x-2">
                  {getPermissionIcon(permission)}
                  <span className="text-sm">{permission}</span>
                </div>
              ))}
            </div>
            
            {!hasAdvancedPermissions && hasBasicPermissions && (
              <Button 
                onClick={onRequestAdvanced} 
                disabled={isLoading}
                className="w-full"
                size="sm"
              >
                {isLoading ? 'Solicitando...' : 'Solicitar Permissões Avançadas'}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Granted Permissions List */}
      {grantedPermissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Permissões Ativas</CardTitle>
            <CardDescription>
              Estas são as permissões atualmente concedidas à sua aplicação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {grantedPermissions.map((permission) => (
                <Badge key={permission} variant="outline" className="text-xs">
                  <CheckCircle className="w-3 h-3 mr-1 text-green-500" />
                  {permission}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MetaAdsPermissionStatus;
