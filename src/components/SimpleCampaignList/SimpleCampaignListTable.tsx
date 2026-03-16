
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Pause, Eye, RefreshCw } from 'lucide-react';
import { SimpleCampaignListItem } from '@/hooks/useSimpleCampaignList';
import { SimpleCampaignListActions } from './SimpleCampaignListActions';
import { SimpleCampaignListEmptyState } from './SimpleCampaignListEmptyState';
import { SimpleCampaignListLoadingState } from './SimpleCampaignListLoadingState';
import { CampaignPreviewImage } from '@/components/common/CampaignPreviewImage';

interface SimpleCampaignListTableProps {
  campaigns: SimpleCampaignListItem[];
  isLoading: boolean;
  error: string | null;
  onPauseCampaign: (campaignId: string, campaignName: string) => void;
  onActivateCampaign: (campaignId: string, campaignName: string) => void;
  onDuplicateCampaign?: (campaignId: string) => void;
  duplicatingCampaignId?: string | null;
  onRefresh: () => void;
}

export const SimpleCampaignListTable: React.FC<SimpleCampaignListTableProps> = ({
  campaigns,
  isLoading,
  error,
  onPauseCampaign,
  onActivateCampaign,
  onDuplicateCampaign,
  duplicatingCampaignId,
  onRefresh
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge className="bg-green-100 text-green-800">🟢 Ativa</Badge>;
      case 'PAUSED':
        return <Badge className="bg-yellow-100 text-yellow-800">🟡 Pausada</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-100 text-red-800">🔴 Rejeitada</Badge>;
      default:
        return <Badge variant="secondary">❓ Desconhecido</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (isLoading) {
    return <SimpleCampaignListLoadingState />;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">❌ {error}</div>
        <Button onClick={onRefresh} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return <SimpleCampaignListEmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Preview</TableHead>
            <TableHead>Nome da Campanha</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Criada em</TableHead>
            <TableHead className="text-right">Impressões</TableHead>
            <TableHead className="text-right">Cliques</TableHead>
            <TableHead className="text-right">CPL</TableHead>
            <TableHead className="text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.campaignId}>
              <TableCell>
                <div className="w-16 h-16 flex-shrink-0">
                  <CampaignPreviewImage 
                    src={campaign.mediaPreviewUrl} 
                    alt={`Preview da campanha ${campaign.name}`}
                    className="w-full h-full object-cover rounded"
                  />
                </div>
              </TableCell>
              <TableCell className="font-medium">
                <div>
                  <div>{campaign.name}</div>
                  <div className="text-sm text-gray-500 truncate">
                    ID: {campaign.campaignId}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                {getStatusBadge(campaign.status)}
              </TableCell>
              <TableCell>
                {formatDate(campaign.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                {campaign.impressions.toLocaleString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                {campaign.clicks.toLocaleString('pt-BR')}
              </TableCell>
              <TableCell className="text-right">
                {formatCurrency(campaign.costPerResult)}
              </TableCell>
              <TableCell>
                <SimpleCampaignListActions
                  campaign={campaign}
                  onPause={() => onPauseCampaign(campaign.campaignId, campaign.name)}
                  onActivate={() => onActivateCampaign(campaign.campaignId, campaign.name)}
                  onDuplicate={onDuplicateCampaign ? () => onDuplicateCampaign(campaign.campaignId) : undefined}
                  isDuplicating={duplicatingCampaignId === campaign.campaignId}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
