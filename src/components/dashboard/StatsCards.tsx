
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Eye } from 'lucide-react';

const formatNumber = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '0';
  
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`;
  }
  return value.toFixed(0);
};

const formatCurrency = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return 'R$ 0';
  return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
};

const formatPercentage = (value: number): string => {
  if (isNaN(value) || !isFinite(value)) return '+0%';
  return `+${value.toFixed(1)}%`;
};

export const StatsCards: React.FC = () => {
  const stats = [
    {
      title: 'Campanhas Ativas',
      value: 12,
      change: 20.1,
      icon: TrendingUp,
      color: 'text-green-600'
    },
    {
      title: 'Alcance Total',
      value: 45200,
      change: 18.2,
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Investimento',
      value: 2400,
      change: 12.5,
      icon: DollarSign,
      color: 'text-purple-600'
    },
    {
      title: 'Impressões',
      value: 128400,
      change: 25.1,
      icon: Eye,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => {
        const IconComponent = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <IconComponent className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stat.title === 'Investimento' ? formatCurrency(stat.value) : formatNumber(stat.value)}
              </div>
              <p className="text-xs text-gray-500">
                <span className="text-green-600">{formatPercentage(stat.change)}</span> desde o mês passado
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
