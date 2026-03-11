
import React, { useEffect, useState } from 'react';
import { useMetaCampaignInsights } from '@/hooks/useMetaCampaignInsights';
import { MetricsLoadingState } from './metrics/MetricsLoadingState';
import { MetricsEmptyState } from './metrics/MetricsEmptyState';
import { MetricsErrorState } from './metrics/MetricsErrorState';
import { MetricsDisplay } from './metrics/MetricsDisplay';

interface CampaignMetricsCardProps {
  campaignId: string;
  metaCampaignId?: string;
  className?: string;
  objective?: string;
}

export const CampaignMetricsCard: React.FC<CampaignMetricsCardProps> = ({
  campaignId,
  metaCampaignId,
  className = "",
  objective
}) => {
  const { insights: allInsights, isLoading, fetchInsights } = useMetaCampaignInsights();
  const [campaignInsight, setCampaignInsight] = useState<any>(null);

  useEffect(() => {
    if (metaCampaignId) {
      console.log(`🔄 Loading metrics for campaign ${campaignId} with Meta ID ${metaCampaignId}`);
      loadMetrics();
    }
  }, [metaCampaignId, campaignId]);

  const loadMetrics = async () => {
    if (!metaCampaignId) {
      console.log(`⚠️ No Meta Campaign ID for campaign ${campaignId}`);
      return;
    }

    try {
      console.log(`📊 Fetching insights for campaign ${campaignId}`);
      await fetchInsights([{ id: campaignId, meta_campaign_id: metaCampaignId }]);
    } catch (error) {
      console.error('Error loading campaign metrics:', error);
    }
  };

  useEffect(() => {
    const insight = allInsights.find(i => i.campaignId === campaignId);
    console.log(`📈 Insight found for campaign ${campaignId}:`, insight);
    setCampaignInsight(insight);
  }, [allInsights, campaignId]);

  // No Meta Campaign ID
  if (!metaCampaignId) {
    return <MetricsEmptyState className={className} type="not-synced" />;
  }

  // Loading state
  if (isLoading) {
    return <MetricsLoadingState className={className} />;
  }

  // No data yet
  if (!campaignInsight) {
    return <MetricsEmptyState className={className} type="no-data" onRefresh={loadMetrics} />;
  }

  // Error state
  if (!campaignInsight.success) {
    return (
      <MetricsErrorState 
        className={className} 
        error={campaignInsight.error} 
        onRetry={loadMetrics} 
      />
    );
  }

  // Success - display metrics
  const metricsData = campaignInsight.insights || {};
  
  return (
    <div className={className}>
      <MetricsDisplay 
        metricsData={metricsData} 
        onRefresh={loadMetrics} 
        objective={objective}
      />
      
      {/* Debug Info (remove in production) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-500 mt-4">
          <summary>Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
            {JSON.stringify({ campaignId, metaCampaignId, campaignInsight }, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
};
