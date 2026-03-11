
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BarChart3, RefreshCw, TrendingUp, Eye, MousePointer, DollarSign } from 'lucide-react';

interface CampaignInsight {
  campaignId: string;
  metaCampaignId: string;
  insights: {
    impressions?: number;
    clicks?: number;
    spend?: number;
    cpm?: number;
    cpc?: number;
    ctr?: number;
    reach?: number;
    frequency?: number;
  };
  success: boolean;
  error?: string;
}

interface CampaignInsightsCardProps {
  campaignId: string;
  campaignName: string;
  insight: CampaignInsight | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export const CampaignInsightsCard: React.FC<CampaignInsightsCardProps> = ({
  campaignId,
  campaignName,
  insight,
  isLoading,
  onRefresh
}) => {
  const formatNumber = (value: number | undefined): string => {
    if (value === undefined || value === null) return '-';
    
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    
    return value.toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number | undefined): string => {
    if (value === undefined || value === null) return '-';
    return `R$ ${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number | undefined): string => {
    if (value === undefined || value === null) return '-';
    return `${value.toFixed(2)}%`;
  };

  if (!insight) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="truncate">{campaignName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">
            Clique em atualizar para carregar as métricas
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!insight.success) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="truncate">{campaignName}</span>
            <Badge variant="destructive">Erro</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-red-600">
            {insight.error || 'Erro ao carregar métricas'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="mt-2"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { insights } = insight;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="truncate">{campaignName}</span>
          <div className="flex items-center space-x-2">
            <Badge className="bg-green-500">
              <BarChart3 className="w-3 h-3 mr-1" />
              Métricas
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Impressions & Reach */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-xs text-gray-600">Impressões</div>
                <div className="font-semibold">{formatNumber(insights.impressions)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-purple-500" />
              <div>
                <div className="text-xs text-gray-600">Alcance</div>
                <div className="font-semibold">{formatNumber(insights.reach)}</div>
              </div>
            </div>
          </div>

          {/* Clicks & CTR */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <MousePointer className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-xs text-gray-600">Cliques</div>
                <div className="font-semibold">{formatNumber(insights.clicks)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-orange-500" />
              <div>
                <div className="text-xs text-gray-600">CTR</div>
                <div className="font-semibold">{formatPercentage(insights.ctr)}</div>
              </div>
            </div>
          </div>

          {/* Spend & CPC */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-red-500" />
              <div>
                <div className="text-xs text-gray-600">Gasto</div>
                <div className="font-semibold">{formatCurrency(insights.spend)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-yellow-500" />
              <div>
                <div className="text-xs text-gray-600">CPC</div>
                <div className="font-semibold">{formatCurrency(insights.cpc)}</div>
              </div>
            </div>
          </div>

          {/* CPM & Frequency */}
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4 text-indigo-500" />
              <div>
                <div className="text-xs text-gray-600">CPM</div>
                <div className="font-semibold">{formatCurrency(insights.cpm)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-pink-500" />
              <div>
                <div className="text-xs text-gray-600">Frequência</div>
                <div className="font-semibold">{insights.frequency?.toFixed(2) || '-'}</div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
