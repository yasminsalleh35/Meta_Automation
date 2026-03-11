
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface CampaignSyncDashboardProps {
  totalCampaigns: number;
  syncedCount: number;
  outOfSyncCount: number;
  lastSyncTime: Date | null;
  isSyncing: boolean;
  hasMetaIntegration: boolean;
  onManualSync: () => void;
}

export const CampaignSyncDashboard: React.FC<CampaignSyncDashboardProps> = ({
  totalCampaigns,
  syncedCount,
  outOfSyncCount,
  lastSyncTime,
  isSyncing,
  hasMetaIntegration,
  onManualSync
}) => {
  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Agora mesmo';
    if (diffMins < 60) return `${diffMins} min atrás`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    
    return date.toLocaleDateString('pt-BR');
  };

  if (!hasMetaIntegration) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span>Sincronização Meta Ads</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Configure a integração com Meta Ads para sincronizar o status das campanhas automaticamente.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span>Sincronização Meta Ads</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onManualSync}
            disabled={isSyncing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalCampaigns}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{syncedCount}</div>
            <div className="text-sm text-gray-600">Sincronizadas</div>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{outOfSyncCount}</div>
            <div className="text-sm text-gray-600">Dessincronizadas</div>
          </div>
        </div>
        
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">
              Última sincronização: {formatLastSync(lastSyncTime)}
            </span>
          </div>
          
          <div className="flex space-x-2">
            {outOfSyncCount > 0 && (
              <Badge variant="destructive" className="flex items-center space-x-1">
                <AlertTriangle className="w-3 h-3" />
                <span>{outOfSyncCount} precisam atenção</span>
              </Badge>
            )}
            
            {syncedCount === totalCampaigns && totalCampaigns > 0 && (
              <Badge className="bg-green-500 flex items-center space-x-1">
                <CheckCircle className="w-3 h-3" />
                <span>Tudo sincronizado</span>
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
