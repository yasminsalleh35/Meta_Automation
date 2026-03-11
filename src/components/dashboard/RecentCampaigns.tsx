import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCampaignsCache } from '@/hooks/useCampaignsCache';
import { useMetaCampaignMutation } from '@/hooks/useMetaCampaignMutation';
import { useIndividualCampaignRefresh } from '@/hooks/useIndividualCampaignRefresh';
import { EnhancedDashboardCampaignCard } from '@/components/campaign/EnhancedDashboardCampaignCard';
import { CampaignLoadingProgress } from '@/components/campaign/CampaignLoadingProgress';
import { useToast } from '@/hooks/use-toast';

export const RecentCampaigns: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: campaigns, isLoading, error, refetch } = useCampaignsCache({ page_size: 3 });
  const { activateCampaign, pauseCampaign } = useMetaCampaignMutation();
  const { refreshCampaign, isRefreshing } = useIndividualCampaignRefresh();

  const handleStatusToggle = async (campaignId: string, newStatus: 'active' | 'paused') => {
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
    } else {
      await pauseCampaign(campaignId, campaign.metaCampaignId);
    }
    
    // Refetch after status change
    setTimeout(() => refetch(), 1000);
  };

  const handleRefreshMetrics = async (campaignId: string, metaCampaignId: string) => {
    const campaign = campaigns.find((c: any) => c.id === campaignId);
    await refreshCampaign(metaCampaignId, campaignId, campaign?.name);
  };

  const handleViewDetails = (campaignId: string) => {
    navigate('/dashboard/campaigns');
  };

  if (isLoading) {
    return <CampaignLoadingProgress />;
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Campanhas Recentes</CardTitle>
          <CardDescription>
            Suas campanhas mais recentes e seu desempenho
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <AlertCircle className="w-8 h-8 text-destructive" />
            <p className="text-sm text-muted-foreground text-center">
              Erro ao carregar campanhas. Tente novamente mais tarde.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const recentCampaigns = campaigns || [];

  return (
    <Card className="relative isolate overflow-hidden">
      <CardHeader>
        <CardTitle>Campanhas Recentes</CardTitle>
        <CardDescription>
          Suas campanhas mais recentes e seu desempenho
        </CardDescription>
      </CardHeader>
      <CardContent>
        {recentCampaigns.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma campanha encontrada. Crie sua primeira campanha!
            </p>
            <Button onClick={() => navigate('/dashboard/simple-campaign-wizard')}>
              Criar Campanha
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-4 relative z-10">
              {recentCampaigns.map((campaign) => (
                <EnhancedDashboardCampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  onStatusToggle={handleStatusToggle}
                  onViewDetails={handleViewDetails}
                  onRefreshMetrics={handleRefreshMetrics}
                  isRefreshing={isRefreshing(campaign.id)}
                />
              ))}
            </div>
            <div className="mt-6 mx-3 sm:mx-0">
              <Button 
                variant="outline" 
                className="w-full text-sm sm:text-base"
                onClick={() => navigate('/dashboard/campaigns')}
              >
                Ver Todas as Campanhas
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
