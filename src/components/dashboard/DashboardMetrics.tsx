import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Eye, MousePointer, TrendingUp, DollarSign } from 'lucide-react';

interface MetricsData {
  activeCampaigns: number;
  impressions: number;
  reach: number;
  clicks: number;
  cpa: number;
  ctr: number;
  spend: number;
}

interface DashboardMetricsProps {
  data: MetricsData;
  isLoading?: boolean;
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ 
  data, 
  isLoading = false 
}) => {
  const formatNumber = (num: number): string => {
    // Validação: se não for número válido, retornar 0
    if (typeof num !== 'number' || isNaN(num) || !Number.isFinite(num)) {
      return '0';
    }
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return Math.round(num).toLocaleString('pt-BR');
  };

  const formatCurrency = (num: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const formatPercentage = (num: number): string => {
    return `${num.toFixed(2)}%`;
  };

  const metricsConfig = [
    {
      title: 'Campanhas Ativas',
      value: data.activeCampaigns.toString(),
      icon: Activity,
      color: 'text-primary'
    },
    {
      title: 'Impressões',
      value: formatNumber(data.impressions),
      icon: Eye,
      color: 'text-secondary'
    },
    {
      title: 'Alcance',
      value: formatNumber(data.reach),
      icon: Eye,
      color: 'text-facebook-blue'
    },
    {
      title: 'Cliques',
      value: formatNumber(data.clicks),
      icon: MousePointer,
      color: 'text-primary'
    },
    {
      title: 'CPA',
      value: formatCurrency(data.cpa),
      icon: DollarSign,
      color: 'text-facebook-green'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
      {metricsConfig.map((metric, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {metric.title}
            </CardTitle>
            <metric.icon className={`h-4 w-4 ${metric.color}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-xl sm:text-2xl font-bold ${isLoading ? 'animate-pulse' : ''}`}>
              {metric.value}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};