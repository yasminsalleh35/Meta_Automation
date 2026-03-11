
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Play, Pause, Trash2, BarChart3, RefreshCw } from 'lucide-react';
import { useMetaBulkOperations } from '@/hooks/useMetaBulkOperations';

interface Campaign {
  id: string;
  name: string;
  meta_campaign_id?: string;
  status: string;
}

interface BulkOperationsPanelProps {
  campaigns: Campaign[];
  onRefresh?: () => void;
}

export const BulkOperationsPanel: React.FC<BulkOperationsPanelProps> = ({
  campaigns,
  onRefresh
}) => {
  const { isLoading, executeBulkOperation, triggerAutoSync } = useMetaBulkOperations();
  const [selectedCampaigns, setSelectedCampaigns] = useState<Set<string>>(new Set());

  const campaignsWithMeta = campaigns.filter(c => c.meta_campaign_id);
  const selectedWithMeta = campaigns
    .filter(c => selectedCampaigns.has(c.id) && c.meta_campaign_id)
    .map(c => ({ id: c.id, meta_campaign_id: c.meta_campaign_id! }));

  const handleSelectAll = () => {
    if (selectedCampaigns.size === campaignsWithMeta.length) {
      setSelectedCampaigns(new Set());
    } else {
      setSelectedCampaigns(new Set(campaignsWithMeta.map(c => c.id)));
    }
  };

  const handleSelectCampaign = (campaignId: string) => {
    const newSelected = new Set(selectedCampaigns);
    if (newSelected.has(campaignId)) {
      newSelected.delete(campaignId);
    } else {
      newSelected.add(campaignId);
    }
    setSelectedCampaigns(newSelected);
  };

  const handleBulkOperation = async (action: 'pause' | 'activate' | 'delete') => {
    if (selectedWithMeta.length === 0) return;

    const success = await executeBulkOperation(
      selectedWithMeta,
      action,
      () => {
        setSelectedCampaigns(new Set());
        onRefresh?.();
      }
    );

    if (success) {
      setSelectedCampaigns(new Set());
    }
  };

  const handleAutoSync = async () => {
    await triggerAutoSync();
    onRefresh?.();
  };

  if (campaignsWithMeta.length === 0) {
    return (
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-sm">Operações em Lote</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Nenhuma campanha com integração Meta Ads encontrada.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          <span>Operações em Lote</span>
          <Badge variant="outline">
            {campaignsWithMeta.length} campanhas Meta
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={selectedCampaigns.size === campaignsWithMeta.length && campaignsWithMeta.length > 0}
              onCheckedChange={handleSelectAll}
            />
            <span className="text-sm">
              Selecionar todas ({selectedCampaigns.size}/{campaignsWithMeta.length})
            </span>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAutoSync}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Auto
          </Button>
        </div>

        {/* Campaign List */}
        <div className="max-h-40 overflow-y-auto space-y-2">
          {campaignsWithMeta.map(campaign => (
            <div key={campaign.id} className="flex items-center space-x-2">
              <Checkbox
                checked={selectedCampaigns.has(campaign.id)}
                onCheckedChange={() => handleSelectCampaign(campaign.id)}
              />
              <span className="text-sm flex-1 truncate">{campaign.name}</span>
              <Badge variant="outline" className="text-xs">
                {campaign.status}
              </Badge>
            </div>
          ))}
        </div>

        {/* Bulk Actions */}
        {selectedWithMeta.length > 0 && (
          <div className="flex space-x-2 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkOperation('activate')}
              disabled={isLoading}
              className="flex-1"
            >
              <Play className="w-4 h-4 mr-1" />
              Ativar ({selectedWithMeta.length})
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkOperation('pause')}
              disabled={isLoading}
              className="flex-1"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pausar ({selectedWithMeta.length})
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleBulkOperation('delete')}
              disabled={isLoading}
              className="flex-1"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Excluir ({selectedWithMeta.length})
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
