import React from 'react';
import { ModernCampaignCard } from './ModernCampaignCard';
import type { LiveCampaign } from '@/types/liveCampaign';

interface CampaignListProps {
  campaigns: LiveCampaign[];
  onStatusChange: (campaignId: string, newStatus: 'active' | 'paused') => void;
  onRefresh: () => void;
  onRefreshMetrics?: (campaignId: string, metaCampaignId: string) => Promise<void>;
  isRefreshing?: (campaignId: string) => boolean;
  isLoading?: boolean;
  isGlobalRefreshing?: boolean;
}

export const CampaignList: React.FC<CampaignListProps> = ({
  campaigns,
  onStatusChange,
  onRefresh,
  onRefreshMetrics,
  isRefreshing,
  isLoading = false,
  isGlobalRefreshing = false
}) => {
  return (
    <div className="space-y-4">
      {campaigns.map((campaign) => (
        <div key={campaign.id} className="animate-fade-in">
          <ModernCampaignCard
            campaign={campaign}
            onStatusChange={onStatusChange}
            onRefresh={onRefresh}
            onRefreshMetrics={onRefreshMetrics}
            isIndividualRefreshing={isRefreshing ? isRefreshing(campaign.id) : false}
            isLoading={isLoading}
            isRefreshing={isGlobalRefreshing}
          />
        </div>
      ))}
    </div>
  );
};
