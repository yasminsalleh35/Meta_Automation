
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  MousePointer, 
  DollarSign, 
  Target,
  RefreshCw
} from 'lucide-react';

interface CampaignMetrics {
  impressions: number;
  clicks: number;
  spend: number;
  ctr: number;
  cpc: number;
  cpm: number;
  reach: number;
  frequency: number;
}

interface CampaignMetricsWidgetProps {
  campaignId: string;
  campaignName: string;
  metrics: CampaignMetrics | null;
  isLoading: boolean;
  lastUpdated?: Date;
  onRefresh: () => void;
}

export const CampaignMetricsWidget: React.FC<CampaignMetricsWidgetProps> = ({
  campaignId,
  campaignName,
  metrics,
  isLoading,
  lastUpdated,
  onRefresh
}) => {
  const formatNumber = (value: number): string => {
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `${(value / 1000).toFixed(1)}K`;
    }
    return value.toLocaleString('pt-BR');
  };

  const formatCurrency = (value: number): string => {
    return `R$ ${value.toFixed(2)}`;
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  const getPerformanceIndicator = (ctr: number) => {
    if (ctr >= 2.0) return { icon: TrendingUp, color: 'text-green-500', label: 'Excelente' };
    if (ctr >= 1.0) return { icon: TrendingUp, color: 'text-blue-500', label: 'Bom' };
    if (ctr >= 0.5) return { icon: Target, color: 'text-yellow-500', label: 'Médio' };
    return { icon: TrendingDown, color: 'text-red-500', label: 'Baixo' };
  };

  if (!metrics && !isLoading) {
    return (
      <Card className="border-gray-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="truncate">{campaignName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 text-center py-4">
            Clique para carregar métricas
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="border-blue-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-sm">
            <span className="truncate">{campaignName}</span>
            <Badge variant="outline">Carregando...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-6 bg-gray-300 rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  const performanceIndicator = getPerformanceIndicator(metrics.ctr);
  const PerformanceIcon = performanceIndicator.icon;

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-blue-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-sm">
          <span className="truncate">{campaignName}</span>
          <div className="flex items-center space-x-2">
            <Badge className={`${performanceIndicator.color} bg-white`}>
              <PerformanceIcon className="w-3 h-3 mr-1" />
              {performanceIndicator.label}
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
        {lastUpdated && (
          <div className="text-xs text-gray-500">
            Atualizado: {lastUpdated.toLocaleTimeString('pt-BR')}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {/* Primary Metrics */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-blue-500" />
              <div>
                <div className="text-xs text-gray-600">Impressões</div>
                <div className="font-bold text-lg">{formatNumber(metrics.impressions)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <MousePointer className="w-4 h-4 text-green-500" />
              <div>
                <div className="text-xs text-gray-600">Cliques</div>
                <div className="font-bold text-lg">{formatNumber(metrics.clicks)}</div>
              </div>
            </div>
          </div>

          {/* Cost Metrics */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-red-500" />
              <div>
                <div className="text-xs text-gray-600">Gasto Total</div>
                <div className="font-bold text-lg">{formatCurrency(metrics.spend)}</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Target className="w-4 h-4 text-purple-500" />
              <div>
                <div className="text-xs text-gray-600">CTR</div>
                <div className="font-bold text-lg">{formatPercentage(metrics.ctr)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-gray-500">CPC</div>
              <div className="font-semibold">{formatCurrency(metrics.cpc)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">CPM</div>
              <div className="font-semibold">{formatCurrency(metrics.cpm)}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500">Alcance</div>
              <div className="font-semibold">{formatNumber(metrics.reach)}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
