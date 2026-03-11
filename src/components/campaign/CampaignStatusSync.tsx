
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { CampaignSyncResult } from '@/types/campaignManagement';

interface CampaignStatusSyncProps {
  campaignId: string;
  syncResult: CampaignSyncResult | null;
  isLoading: boolean;
  onSync: () => void;
  onForceSync: () => void;
}

export const CampaignStatusSync: React.FC<CampaignStatusSyncProps> = ({
  campaignId,
  syncResult,
  isLoading,
  onSync,
  onForceSync
}) => {
  if (!syncResult) {
    return (
      <div className="flex items-center space-x-2">
        <Badge variant="outline">Sem Meta ID</Badge>
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  if (!syncResult.success) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <span>Erro na sincronização: {syncResult.error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (syncResult.synced) {
    return (
      <div className="flex items-center space-x-2">
        <Badge className="bg-green-500">
          <CheckCircle className="w-3 h-3 mr-1" />
          Sincronizado
        </Badge>
        <span className="text-sm text-gray-600">
          Local: {syncResult.localStatus} | Meta: {syncResult.metaStatus}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={onSync}
          disabled={isLoading}
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
    );
  }

  return (
    <Alert className="border-yellow-200 bg-yellow-50">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <div className="font-medium">Status dessincronizado</div>
          <div className="text-sm">
            Local: {syncResult.localStatus} | Meta: {syncResult.metaStatus}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onForceSync}
            disabled={isLoading}
          >
            Sincronizar com Meta
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
