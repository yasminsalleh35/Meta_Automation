
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, MousePointer, DollarSign, Target, Eye, RefreshCw } from 'lucide-react';
import { formatCurrency, formatNumber, formatPercentage, getPerformanceLevel } from '@/utils/metricsFormatters';
import { MetricTooltip } from './MetricTooltip';

interface MetricsDisplayProps {
  metricsData: any;
  onRefresh?: () => void;
  className?: string;
  objective?: string;
}

export const MetricsDisplay: React.FC<MetricsDisplayProps> = ({ 
  metricsData, 
  onRefresh,
  className = "",
  objective
}) => {
  const performance = getPerformanceLevel(metricsData.ctr || 0);

  const metrics = [
    {
      label: 'Impressões',
      value: formatNumber(metricsData.impressions || 0),
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Visualizações do anúncio',
      metric: 'impressions'
    },
    {
      label: 'Cliques',
      value: formatNumber(metricsData.clicks || 0),
      icon: MousePointer,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'Interações com o anúncio',
      metric: 'clicks'
    },
    {
      label: 'CTR',
      value: formatPercentage(metricsData.ctr || 0),
      icon: Target,
      color: performance.color,
      bgColor: performance.bgColor,
      description: 'Taxa de cliques',
      metric: 'ctr'
    },
    {
      label: 'Gasto',
      value: formatCurrency(metricsData.spend || 0),
      icon: DollarSign,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Valor investido',
      metric: 'spent'
    }
  ];

  return (
    <div className={`${className} space-y-4`}>
      {/* Performance Indicator */}
      <div className={`${performance.bgColor} rounded-lg p-3 border border-opacity-20 flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          <TrendingUp className={`w-5 h-5 ${performance.color}`} />
          <span className="text-sm font-medium text-gray-700">Performance:</span>
          <Badge className={`${performance.color} bg-white border-current`}>
            {performance.level}
          </Badge>
        </div>
        {onRefresh && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefresh}
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <MetricTooltip key={index} metric={metric.metric} objective={objective}>
              <div className={`${metric.bgColor} rounded-lg p-4 border border-opacity-20 hover:shadow-md transition-all duration-300 hover:scale-105 cursor-help`}>
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className={`w-4 h-4 ${metric.color}`} />
                  <span className="text-xs font-medium text-gray-700">{metric.label}</span>
                </div>
                <div className="font-bold text-lg text-gray-900 mb-1">
                  {metric.value}
                </div>
                <div className="text-xs text-gray-500">
                  {metric.description}
                </div>
              </div>
            </MetricTooltip>
          );
        })}
      </div>

      {/* Additional Metrics */}
      {(metricsData.cpc > 0 || metricsData.cpm > 0) && (
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
          {metricsData.cpc > 0 && (
            <MetricTooltip metric="cpc" objective={objective}>
              <div className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-all duration-300 cursor-help">
                <div className="text-xs text-gray-600 mb-1">CPC Médio</div>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(metricsData.cpc)}
                </div>
              </div>
            </MetricTooltip>
          )}
          {metricsData.cpm > 0 && (
            <MetricTooltip metric="cpm" objective={objective}>
              <div className="bg-gray-50 rounded-lg p-3 hover:shadow-md transition-all duration-300 cursor-help">
                <div className="text-xs text-gray-600 mb-1">CPM</div>
                <div className="font-semibold text-gray-900">
                  {formatCurrency(metricsData.cpm)}
                </div>
              </div>
            </MetricTooltip>
          )}
        </div>
      )}
    </div>
  );
};
