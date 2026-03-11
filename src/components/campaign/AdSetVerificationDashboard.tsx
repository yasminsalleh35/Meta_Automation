
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  AlertTriangle,
  Settings,
  PlayCircle,
  Info
} from 'lucide-react';
import { useAdSetVerification } from '@/hooks/useAdSetVerification';
import { useAutoVerificationCron } from '@/hooks/useAutoVerificationCron';
import { useToast } from '@/hooks/use-toast';

interface AdSetVerificationDashboardProps {
  campaignId?: string;
  adSetId?: string;
}

export const AdSetVerificationDashboard: React.FC<AdSetVerificationDashboardProps> = ({
  campaignId,
  adSetId
}) => {
  const { toast } = useToast();
  const { 
    verifyAndCorrectAdSet, 
    getPendingVerifications, 
    isLoading 
  } = useAdSetVerification();
  
  const { 
    runAutoVerification, 
    showCronSetupInstructions, 
    isRunning: isAutoRunning 
  } = useAutoVerificationCron();
  
  const [pendingVerifications, setPendingVerifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadPendingVerifications = async () => {
    setRefreshing(true);
    try {
      const pending = await getPendingVerifications();
      setPendingVerifications(pending);
    } catch (error) {
      console.error('Error loading pending verifications:', error);
      toast({
        title: "Erro ao carregar verificações",
        description: "Não foi possível carregar as verificações pendentes",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPendingVerifications();
  }, []);

  const handleManualVerification = async (adSetId: string, adAccountId: string) => {
    try {
      const result = await verifyAndCorrectAdSet(adSetId, adAccountId);
      
      if (result.success) {
        toast({
          title: "Verificação concluída",
          description: `Status: ${result.verification_status}`,
          variant: "default"
        });
        
        // Reload pending verifications
        await loadPendingVerifications();
      }
    } catch (error) {
      console.error('Manual verification failed:', error);
    }
  };

  const handleRunAutoVerification = async () => {
    try {
      await runAutoVerification();
      await loadPendingVerifications();
    } catch (error) {
      console.error('Auto verification failed:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED_OK':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verificado</Badge>;
      case 'CORRECTED':
        return <Badge className="bg-blue-100 text-blue-800"><Settings className="w-3 h-3 mr-1" />Corrigido</Badge>;
      case 'ERROR':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Erro</Badge>;
      case 'PENDING':
      default:
        return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controles Automáticos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PlayCircle className="w-5 h-5" />
            <span>Verificação Automática</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handleRunAutoVerification}
              disabled={isAutoRunning}
            >
              <PlayCircle className={`w-4 h-4 mr-2 ${isAutoRunning ? 'animate-spin' : ''}`} />
              {isAutoRunning ? 'Executando...' : 'Executar Verificação Automática'}
            </Button>
            
            <Button
              variant="outline"
              onClick={showCronSetupInstructions}
            >
              <Info className="w-4 h-4 mr-2" />
              Instruções de Configuração
            </Button>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              A verificação automática processa Ad Sets pendentes e aplica correções quando necessário. 
              Para configurar execução periódica, use as instruções de configuração do cron job.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Dashboard Existente */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Verificação de Ad Sets</span>
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={loadPendingVerifications}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </CardHeader>
        <CardContent>
          {pendingVerifications.length === 0 ? (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Não há verificações pendentes no momento.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-4">
              {pendingVerifications.map((verification) => (
                <Card key={verification.id} className="border-l-4 border-l-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{verification.expected_name}</span>
                          {getStatusBadge(verification.verification_status)}
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          <div>Ad Set ID: {verification.ad_set_id || 'Não definido'}</div>
                          <div>Campaign ID: {verification.campaign_id}</div>
                          <div>Criado em: {new Date(verification.created_at).toLocaleString('pt-BR')}</div>
                          {verification.last_verified_at && (
                            <div>Última verificação: {new Date(verification.last_verified_at).toLocaleString('pt-BR')}</div>
                          )}
                        </div>
                        {verification.error_details && (
                          <Alert className="mt-2">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                              Erro: {JSON.stringify(verification.error_details)}
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                      {verification.ad_set_id && verification.verification_status === 'PENDING' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleManualVerification(verification.ad_set_id, verification.ad_account_id)}
                          disabled={isLoading}
                        >
                          {isLoading ? (
                            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-2" />
                          )}
                          Verificar Agora
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
