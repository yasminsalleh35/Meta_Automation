
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useCampaignsCache } from '@/hooks/useCampaignsCache';
import { useCampaignSyncActions } from '@/hooks/useCampaignSyncActions';
import { useMetaCampaignMutation } from '@/hooks/useMetaCampaignMutation';
import { useIndividualCampaignRefresh } from '@/hooks/useIndividualCampaignRefresh';
import { CampaignHeader } from '@/components/campaign/CampaignHeader';
import { CampaignFilters } from '@/components/campaign/CampaignFilters';
import { CampaignList } from '@/components/campaign/CampaignList';
import { CampaignEmptyState } from '@/components/campaign/CampaignEmptyState';
import { CampaignLoadingProgress } from '@/components/campaign/CampaignLoadingProgress';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search } from 'lucide-react';
import { debounce } from '@/lib/debounce';

const Campaigns: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const {
    data: campaigns,
    isLoading,
    error,
    refetch
  } = useCampaignsCache({ status: filterStatus as any, search: searchTerm });

  const { syncActiveCampaigns, discoverNewCampaigns, refreshOneCampaign, isSyncing, isDiscovering } = useCampaignSyncActions();
  const { activateCampaign, pauseCampaign, isLoading: isMutating } = useMetaCampaignMutation();
  const { refreshCampaign, isRefreshing } = useIndividualCampaignRefresh();

  const handleSyncActives = async () => {
    await syncActiveCampaigns();
    refetch();
  };

  const handleDiscoverNew = async () => {
    await discoverNewCampaigns();
    refetch();
  };

  const handleStatusChange = async (campaignId: string, newStatus: 'active' | 'paused') => {
    const campaign = campaigns.find((c: any) => c.id === campaignId);
    if (!campaign?.metaCampaignId) {
      toast({
        title: "Erro",
        description: "Campanha não possui ID do Meta Ads.",
        variant: "destructive"
      });
      return;
    }

    if (newStatus === 'active') {
      await activateCampaign(campaignId, campaign.metaCampaignId);
      // Optimistic update
      setTimeout(() => refetch(), 1000);
    } else if (newStatus === 'paused') {
      await pauseCampaign(campaignId, campaign.metaCampaignId);
      // Optimistic update
      setTimeout(() => refetch(), 1000);
    }
  };

  const handleRefreshMetrics = async (campaignId: string, metaCampaignId: string) => {
    const campaign = campaigns.find((c: any) => c.id === campaignId);
    await refreshCampaign(metaCampaignId, campaignId, campaign?.name);
  };

  if (isLoading) {
    return <CampaignLoadingProgress />;
  }

  if (error) {
    return (
      <div className="space-y-8 animate-fade-in">
        <CampaignHeader campaigns={[]} isError={true} onRetry={() => refetch()} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <CampaignHeader campaigns={campaigns} />
      
      {/* Sync Actions */}
      <div className="flex gap-3 flex-wrap">
        <Button 
          onClick={handleSyncActives} 
          disabled={isSyncing}
          variant="outline"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          Sincronizar Ativas Agora
        </Button>
        <Button 
          onClick={handleDiscoverNew} 
          disabled={isDiscovering}
          variant="outline"
        >
          <Search className={`w-4 h-4 mr-2 ${isDiscovering ? 'animate-spin' : ''}`} />
          Descobrir Novas Campanhas
        </Button>
      </div>

      <CampaignFilters
        searchTerm={searchTerm}
        filterStatus={filterStatus}
        onSearchChange={setSearchTerm}
        onFilterChange={setFilterStatus}
      />

      <div className="grid gap-6">
        {campaigns.length === 0 ? (
          <CampaignEmptyState hasAnyCampaigns={false} />
        ) : (
          <CampaignList
            campaigns={campaigns as any}
            onStatusChange={handleStatusChange}
            onRefresh={refetch}
            onRefreshMetrics={handleRefreshMetrics}
            isRefreshing={isRefreshing}
            isLoading={isMutating}
            isGlobalRefreshing={false}
          />
        )}
      </div>
    </div>
  );
};

export default Campaigns;
