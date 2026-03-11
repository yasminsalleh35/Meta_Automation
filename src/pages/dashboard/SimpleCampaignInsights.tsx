
import React from 'react';
import { useParams } from 'react-router-dom';
import { SimpleCampaignInsightsContainer } from '@/components/SimpleCampaignInsights/SimpleCampaignInsightsContainer';

const SimpleCampaignInsightsPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();

  if (!campaignId) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">ID da campanha não encontrado</h1>
          <p className="text-gray-600">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  return <SimpleCampaignInsightsContainer campaignId={campaignId} />;
};

export default SimpleCampaignInsightsPage;
