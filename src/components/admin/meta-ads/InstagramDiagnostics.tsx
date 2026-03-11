
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, Bug, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useMetaAdsAssets } from '@/hooks/useMetaAdsAssets';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { metaAdsAccountService } from '@/services/metaAds/MetaAdsAccountService';

export const InstagramDiagnostics: React.FC = () => {
  const { existingIntegration } = useMetaAdsIntegration();
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<any>(null);

  const handleRunDiagnostics = async () => {
    if (!existingIntegration?.access_token) {
      return;
    }

    setIsRunning(true);
    try {
      const results = await metaAdsAccountService.runDiagnostics(existingIntegration.access_token);
      setDiagnosticResults(results);
    } catch (error) {
      console.error('Error running diagnostics:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="w-4 h-4 text-green-600" />
    ) : (
      <XCircle className="w-4 h-4 text-red-600" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Sucesso
      </Badge>
    ) : (
      <Badge variant="destructive">
        Falhou
      </Badge>
    );
  };

  if (!existingIntegration) {
    return (
      <Alert className="border-yellow-200 bg-yellow-50">
        <AlertTriangle className="h-4 w-4 text-yellow-600" />
        <AlertDescription>
          Nenhuma integração Meta Ads encontrada. Configure a integração primeiro.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Bug className="w-5 h-5" />
          <span>Diagnóstico do Instagram</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Button 
            onClick={handleRunDiagnostics} 
            disabled={isRunning}
            variant="outline"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Executando Diagnóstico...
              </>
            ) : (
              <>
                <Bug className="w-4 h-4 mr-2" />
                Executar Diagnóstico
              </>
            )}
          </Button>
        </div>

        {diagnosticResults && (
          <div className="space-y-4">
            {/* Token Diagnosis */}
            {diagnosticResults.tokenDiagnosis && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-2 flex items-center space-x-2">
                  <span>Diagnóstico do Token</span>
                  {getStatusIcon(!!diagnosticResults.tokenDiagnosis.data)}
                </h4>
                
                {diagnosticResults.tokenDiagnosis.data ? (
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>App ID:</strong> {diagnosticResults.tokenDiagnosis.data.app_id}
                    </div>
                    <div>
                      <strong>Usuário ID:</strong> {diagnosticResults.tokenDiagnosis.data.user_id}
                    </div>
                    <div>
                      <strong>Válido:</strong> {diagnosticResults.tokenDiagnosis.data.is_valid ? 'Sim' : 'Não'}
                    </div>
                    <div>
                      <strong>Scopes:</strong> {diagnosticResults.tokenDiagnosis.data.scopes?.join(', ') || 'N/A'}
                    </div>
                  </div>
                ) : (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription>
                      Não foi possível obter informações do token.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Connectivity Tests */}
            {diagnosticResults.connectivityTest && (
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold mb-3">Teste de Conectividade Instagram</h4>
                
                <div className="space-y-3">
                  {diagnosticResults.connectivityTest.map((test: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(test.success)}
                        <span className="font-medium">{test.name}</span>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(test.success)}
                        <span className="text-sm text-gray-500">
                          Status: {test.status || 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommendations */}
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTriangle className="h-4 w-4 text-blue-600" />
              <AlertDescription>
                <strong>Dicas para resolver problemas:</strong>
                <ul className="mt-2 list-disc pl-5 space-y-1">
                  <li>Verifique se a conta do Instagram está conectada ao Meta Business Manager</li>
                  <li>Confirme se a conta do Instagram está associada à Página do Facebook</li>
                  <li>Verifique se o App Meta tem as permissões corretas para Instagram</li>
                  <li>Tente desconectar e reconectar a integração</li>
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
