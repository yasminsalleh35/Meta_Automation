
import React from 'react';
import { ArrowLeft, RefreshCw, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useSimpleCampaignInsights } from '@/hooks/useSimpleCampaignInsights';
import { SimpleCampaignInsightsHeader } from './SimpleCampaignInsightsHeader';
import { SimpleCampaignInsightsStats } from './SimpleCampaignInsightsStats';
import { SimpleCampaignInsightsChart } from './SimpleCampaignInsightsChart';
import { SimpleCampaignInsightsLoading } from './SimpleCampaignInsightsLoading';
import { SimpleCampaignInsightsError } from './SimpleCampaignInsightsError';
import { OptimizationPanel } from '@/components/optimization/OptimizationPanel';

interface SimpleCampaignInsightsContainerProps {
  campaignId: string;
}

export const SimpleCampaignInsightsContainer: React.FC<SimpleCampaignInsightsContainerProps> = ({
  campaignId
}) => {
  const { campaign, insights, dailyInsights, isLoading, isRefreshing, error, lastSyncAt, refetch } = useSimpleCampaignInsights(campaignId);

  const formatLastSync = (isoDate: string | null) => {
    if (!isoDate) return 'Nunca sincronizado';
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMin = Math.floor(diffMs / 60000);

    if (diffMin < 1) return 'Agora mesmo';
    if (diffMin < 60) return `${diffMin} min atrás`;
    const diffHours = Math.floor(diffMin / 60);
    if (diffHours < 24) return `${diffHours}h atrás`;
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  };

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
        {/* Back Button + Refresh */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" asChild>
            <Link to="/dashboard/simple-campaign-list">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Campanhas
            </Link>
          </Button>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatLastSync(lastSyncAt)}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={refetch}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Atualizando...' : 'Atualizar Métricas'}
            </Button>
          </div>
        </div>

        {/* Header */}
        <SimpleCampaignInsightsHeader campaign={campaign} />

        {/* Stats Cards */}
        <SimpleCampaignInsightsStats insights={insights} />

        {/* Chart with real daily data */}
        <Card className="mt-6">
          <CardContent className="p-6">
            <SimpleCampaignInsightsChart dailyInsights={dailyInsights} />
          </CardContent>
        </Card>

        {/* AI Optimization Suggestions */}
        <div className="mt-6">
          <OptimizationPanel campaignId={campaignId} />
        </div>
      </div>
    </div>
  );
};
