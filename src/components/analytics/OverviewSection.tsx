
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Eye, MousePointer, Target } from 'lucide-react';

interface OverviewData {
  totalSpend: number;
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  averageCTR: number;
  averageCPC: number;
  trends: {
    spend: number;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cpc: number;
  };
}

interface OverviewSectionProps {
  data?: OverviewData;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ data }) => {
  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded mb-2"></div>
              <div className="h-8 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

  const formatNumber = (value: number) => 
    new Intl.NumberFormat('pt-BR').format(value);

  const formatPercentage = (value: number) => 
    `${value.toFixed(2)}%`;

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="w-4 h-4 text-green-600" />;
    if (trend < 0) return <TrendingDown className="w-4 h-4 text-red-600" />;
    return null;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600';
    if (trend < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const kpis = [
    {
      title: 'Investimento Total',
      value: formatCurrency(data.totalSpend),
      trend: data.trends.spend,
      icon: DollarSign,
      color: 'text-camply-blue'
    },
    {
      title: 'Impressões',
      value: formatNumber(data.totalImpressions),
      trend: data.trends.impressions,
      icon: Eye,
      color: 'text-purple-600'
    },
    {
      title: 'Cliques',
      value: formatNumber(data.totalClicks),
      trend: data.trends.clicks,
      icon: MousePointer,
      color: 'text-orange-600'
    },
    {
      title: 'Conversões',
      value: formatNumber(data.totalConversions),
      trend: data.trends.conversions,
      icon: Target,
      color: 'text-camply-green'
    },
    {
      title: 'CTR Médio',
      value: formatPercentage(data.averageCTR),
      trend: data.trends.ctr,
      icon: MousePointer,
      color: 'text-blue-600'
    },
    {
      title: 'CPC Médio',
      value: formatCurrency(data.averageCPC),
      trend: data.trends.cpc,
      icon: DollarSign,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {kpis.map((kpi, index) => {
        const IconComponent = kpi.icon;
        return (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {kpi.title}
              </CardTitle>
              <IconComponent className={`w-4 h-4 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {kpi.value}
              </div>
              <div className="flex items-center space-x-1">
                {getTrendIcon(kpi.trend)}
                <span className={`text-sm ${getTrendColor(kpi.trend)}`}>
                  {Math.abs(kpi.trend).toFixed(1)}%
                </span>
                <span className="text-sm text-gray-500">vs período anterior</span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
