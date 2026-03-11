
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CreditCard, TrendingUp, Target, Zap } from 'lucide-react';
import { Plan } from '@/types/subscription';

interface SubscriptionUsageProps {
  currentPlan: Plan;
}

const SubscriptionUsage: React.FC<SubscriptionUsageProps> = ({ currentPlan }) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === -1) return 0;
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage <= 50) return 'from-green-500 to-emerald-500';
    if (percentage <= 80) return 'from-yellow-500 to-orange-500';
    return 'from-red-500 to-pink-500';
  };

  const usageData = [
    {
      icon: Target,
      label: 'Campanhas Ativas',
      used: 8,
      limit: currentPlan.limits.campaigns,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      icon: TrendingUp,
      label: 'Orçamento Mensal',
      used: 2450,
      limit: currentPlan.limits.monthlyBudget,
      color: 'text-green-600 dark:text-green-400',
      formatter: formatPrice
    },
    {
      icon: Zap,
      label: 'Sugestões de IA',
      used: 12,
      limit: currentPlan.limits.aiSuggestions,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ];

  return (
    <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-xl">
      <CardHeader className="pb-6">
        <CardTitle className="flex items-center space-x-3 text-2xl">
          <div className="p-2 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-slate-800 to-slate-600 dark:from-slate-100 dark:to-slate-300 bg-clip-text text-transparent">
            Plano Atual: {currentPlan.name}
          </span>
        </CardTitle>
        <CardDescription className="text-base text-slate-600 dark:text-slate-300">
          Acompanhe o uso do seu plano atual e monitore seus limites
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {usageData.map((item, index) => {
            const percentage = getUsagePercentage(item.used, item.limit);
            const IconComponent = item.icon;
            
            return (
              <div 
                key={item.label} 
                className="space-y-4 p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <IconComponent className={`w-5 h-5 ${item.color}`} />
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {item.formatter ? item.formatter(item.used) : item.used}/
                      {item.limit === -1 ? '∞' : (item.formatter ? item.formatter(item.limit) : item.limit)}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Progress 
                    value={percentage}
                    className="h-3 bg-slate-200 dark:bg-slate-700"
                  />
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {percentage.toFixed(0)}% usado
                    </span>
                    {percentage > 80 && percentage < 100 && (
                      <span className="text-xs text-orange-600 dark:text-orange-400 font-medium">
                        Próximo do limite
                      </span>
                    )}
                    {percentage >= 100 && (
                      <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Limite atingido
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default SubscriptionUsage;
