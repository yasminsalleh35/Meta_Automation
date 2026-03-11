
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Eye, 
  MousePointer, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target,
  CreditCard,
  Info
} from 'lucide-react';

interface Insights {
  impressions: number;
  clicks: number;
  ctr: number;
  spend: number;
  reach: number;
  leads: number;
  cpl: number;
}

interface SimpleCampaignInsightsStatsProps {
  insights: Insights | null;
}

export const SimpleCampaignInsightsStats: React.FC<SimpleCampaignInsightsStatsProps> = ({
  insights
}) => {
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('pt-BR').format(num);
  };

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(num);
  };

  const formatPercentage = (num: number) => {
    return `${num.toFixed(2)}%`;
  };

  const stats = [
    {
      title: 'Impressões',
      value: insights ? formatNumber(insights.impressions) : '0',
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      tooltip: 'Número total de vezes que seu anúncio foi exibido'
    },
    {
      title: 'Cliques',
      value: insights ? formatNumber(insights.clicks) : '0',
      icon: MousePointer,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      tooltip: 'Número total de cliques no seu anúncio'
    },
    {
      title: 'CTR',
      value: insights ? formatPercentage(insights.ctr) : '0%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      tooltip: 'Taxa de cliques (Clicks ÷ Impressões × 100)'
    },
    {
      title: 'Alcance',
      value: insights ? formatNumber(insights.reach) : '0',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      tooltip: 'Número de pessoas únicas que viram seu anúncio'
    },
    {
      title: 'Leads Gerados',
      value: insights ? formatNumber(insights.leads) : '0',
      icon: Target,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      tooltip: 'Número total de leads capturados pela campanha'
    },
    {
      title: 'Custo por Lead',
      value: insights ? formatCurrency(insights.cpl) : 'R$ 0,00',
      icon: CreditCard,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      tooltip: 'Custo médio para gerar cada lead (Gasto Total ÷ Leads)'
    },
    {
      title: 'Custo Total',
      value: insights ? formatCurrency(insights.spend) : 'R$ 0,00',
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      tooltip: 'Valor total gasto na campanha até o momento'
    }
  ];

  return (
    <TooltipProvider>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mt-6">
        {stats.map((stat, index) => (
          <Card key={index} className="relative">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-xs">{stat.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <CardTitle className="text-sm text-gray-600 font-medium">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </TooltipProvider>
  );
};
