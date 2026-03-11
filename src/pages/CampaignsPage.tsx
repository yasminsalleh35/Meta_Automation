import React from 'react';
import { CampaignHeader } from '@/components/campaign/CampaignHeader';
import { CampaignList } from '@/components/campaign/CampaignList';
import { CampaignLoadingState } from '@/components/campaign/CampaignLoadingState';
import { CampaignEmptyState } from '@/components/campaign/CampaignEmptyState';
import { CampaignSyncDashboard } from '@/components/campaign/CampaignSyncDashboard';
import { useRealCampaigns } from '@/hooks/useRealCampaigns';
import { useRefreshCampaignMetrics } from '@/hooks/useRefreshCampaignMetrics';
import { realToLiveCampaign } from '@/utils/campaignAdapters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, List, RefreshCw } from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  const {
    campaigns: realCampaigns,
    isLoading,
    error,
    refetch,
    syncWithMetaAds,
    hasMetaIntegration,
    syncResults,
    lastSyncTime,
    outOfSyncCampaigns,
    refreshCampaignSync,
    pauseCampaign,
    activateCampaign,
    isSyncing
  } = useRealCampaigns();

  const { refresh, isRefreshing } = useRefreshCampaignMetrics();

  const campaigns = realCampaigns.map(realToLiveCampaign);

  const handleStatusChange = async (campaignId: string, newStatus: 'active' | 'paused') => {
    if (newStatus === 'active') {
      await activateCampaign(campaignId);
    } else {
      await pauseCampaign(campaignId);
    }
  };

  const handleRetry = () => {
    refetch();
  };

  if (isLoading) {
    return <CampaignLoadingState />;
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 space-y-6">
        <CampaignHeader campaigns={[]} isError={true} onRetry={handleRetry} />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <CampaignHeader campaigns={campaigns} />
      
      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <List className="w-4 h-4" />
            Campanhas ({campaigns.length})
          </TabsTrigger>
          <TabsTrigger value="sync" className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Sincronização
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          {campaigns.length === 0 ? (
            <CampaignEmptyState hasAnyCampaigns={false} />
          ) : (
            <CampaignList
              campaigns={campaigns}
              onStatusChange={handleStatusChange}
              onRefresh={refresh}
              isLoading={false}
              isGlobalRefreshing={isRefreshing}
            />
          )}
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <CampaignSyncDashboard
            totalCampaigns={campaigns.length}
            syncedCount={realCampaigns.filter(c => c.meta_campaign_id).length}
            outOfSyncCount={outOfSyncCampaigns.length}
            lastSyncTime={lastSyncTime}
            isSyncing={isSyncing}
            hasMetaIntegration={hasMetaIntegration}
            onManualSync={syncWithMetaAds}
          />
          
          {syncResults && Array.isArray(syncResults) && syncResults.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados da Última Sincronização</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p>📊 Campanhas processadas: {syncResults.length}</p>
                  <p className="text-sm text-gray-600">
                    Status de sincronização dos últimos processamentos
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics de Campanhas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analytics detalhados em breve...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CampaignsPage;