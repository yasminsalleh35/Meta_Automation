
import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSimpleCampaignInsights } from '@/hooks/useSimpleCampaignInsights';
import { SimpleCampaignInsightsHeader } from './SimpleCampaignInsightsHeader';
import { SimpleCampaignInsightsStats } from './SimpleCampaignInsightsStats';
import { SimpleCampaignInsightsChart } from './SimpleCampaignInsightsChart';
import { SimpleCampaignInsightsLoading } from './SimpleCampaignInsightsLoading';
import { SimpleCampaignInsightsError } from './SimpleCampaignInsightsError';

interface SimpleCampaignInsightsContainerProps {
  campaignId: string;
}

export const SimpleCampaignInsightsContainer: React.FC<SimpleCampaignInsightsContainerProps> = ({
  campaignId
}) => {
  const { campaign, insights, isLoading, error, refetch } = useSimpleCampaignInsights(campaignId);

  if (isLoading) {
    return <SimpleCampaignInsightsLoading />;
  }

  if (error) {
    return <SimpleCampaignInsightsError error={error} onRetry={refetch} />;
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Campanha não encontrada</h1>
          <p className="text-gray-600 mb-4">Verifique se você tem acesso a esta campanha.</p>
          <Button asChild>
            <Link to="/dashboard/simple-campaign-list">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Campanhas
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/dashboard/simple-campaign-list">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Campanhas
            </Link>
          </Button>
        </div>

        {/* Header */}
        <SimpleCampaignInsightsHeader campaign={campaign} />

        {/* Stats Cards */}
        <SimpleCampaignInsightsStats insights={insights} />

        {/* Chart */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <SimpleCampaignInsightsChart insights={insights} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
