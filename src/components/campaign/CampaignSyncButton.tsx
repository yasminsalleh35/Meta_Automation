
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Link, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CampaignSyncButtonProps {
  hasMetaIntegration: boolean;
  campaignsCount: number;
  campaignsWithoutMetaId: number;
  isSyncing: boolean;
  onSync: () => Promise<void>;
}

export const CampaignSyncButton: React.FC<CampaignSyncButtonProps> = ({
  hasMetaIntegration,
  campaignsCount,
  campaignsWithoutMetaId,
  isSyncing,
  onSync
}) => {
  const { toast } = useToast();

  if (!hasMetaIntegration) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <AlertTriangle className="w-4 h-4" />
        <span>Configure Meta Ads para sincronizar</span>
      </div>
    );
  }

  if (campaignsWithoutMetaId === 0) {
    return (
      <div className="flex items-center gap-2">
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          Todas sincronizadas
        </Badge>
      </div>
    );
  }

  const handleSync = async () => {
    try {
      await onSync();
    } catch (error) {
      toast({
        title: "Erro na sincronização",
        description: "Tente novamente em alguns instantes.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="flex items-center gap-3">
      <Badge variant="outline" className="text-orange-700 border-orange-200 bg-orange-50">
        <AlertTriangle className="w-3 h-3 mr-1" />
        {campaignsWithoutMetaId} precisam sincronização
      </Badge>
      
      <Button
        onClick={handleSync}
        disabled={isSyncing}
        size="sm"
        className="flex items-center gap-2"
      >
        <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
        {isSyncing ? 'Sincronizando...' : 'Sincronizar Meta Ads'}
      </Button>
    </div>
  );
};
