
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Eye,
  MousePointer,
  TrendingUp,
  DollarSign,
  Users,
  MessageCircle,
  CreditCard,
  Info
} from 'lucide-react';
import type { Insights } from '@/hooks/useSimpleCampaignInsights';

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
    return `${Number(num).toFixed(2)}%`;
  };

  const stats = [
    {
      title: 'Impressões',
      value: insights ? formatNumber(insights.impressions) : '-',
      icon: Eye,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      tooltip: 'Número total de vezes que seu anúncio foi exibido'
    },
    {
      title: 'Alcance',
      value: insights ? formatNumber(insights.reach) : '-',
      icon: Users,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      tooltip: 'Número de pessoas únicas que viram seu anúncio'
    },
    {
      title: 'Cliques',
      value: insights ? formatNumber(insights.clicks) : '-',
      icon: MousePointer,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      tooltip: 'Número total de cliques no seu anúncio'
    },
    {
      title: 'CTR',
      value: insights ? formatPercentage(insights.ctr) : '-',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      tooltip: 'Taxa de cliques (Cliques ÷ Impressões × 100)'
    },
    {
      title: 'Conversas',
      value: insights ? formatNumber(insights.conversations) : '-',
      icon: MessageCircle,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      tooltip: 'Conversas iniciadas via WhatsApp nos últimos 7 dias'
    },
    {
      title: 'Custo/Conversa',
      value: insights ? formatCurrency(insights.costPerConversation) : '-',
      icon: CreditCard,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      tooltip: 'Custo médio para iniciar cada conversa no WhatsApp'
    },
    {
      title: 'Gasto Total',
      value: insights ? formatCurrency(insights.spend) : '-',
      icon: DollarSign,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      tooltip: 'Valor total gasto na campanha (últimos 30 dias)'
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
