
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BillingPeriod } from '@/types/subscription';

interface BillingPeriodToggleProps {
  billingPeriod: BillingPeriod;
  onBillingPeriodChange: (period: BillingPeriod) => void;
}

const BillingPeriodToggle: React.FC<BillingPeriodToggleProps> = ({
  billingPeriod,
  onBillingPeriodChange
}) => {
  return (
    <Card className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-xl">
      <CardContent className="pt-8 pb-6">
        <div className="flex flex-col items-center space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
            Período de Cobrança
          </h3>
          
          <div className="relative bg-slate-100 dark:bg-slate-700 p-1.5 rounded-xl inline-flex shadow-inner">
            <button
              onClick={() => onBillingPeriodChange('monthly')}
              className={`relative px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 ${
                billingPeriod === 'monthly'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-lg transform scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600/50'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => onBillingPeriodChange('annual')}
              className={`relative px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-300 flex items-center space-x-2 ${
                billingPeriod === 'annual'
                  ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-lg transform scale-105'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600/50'
              }`}
            >
              <span>Anual</span>
              <Badge className="bg-gradient-to-r from-green-500 to-emerald-500 text-white text-xs font-bold px-2 py-1 animate-pulse shadow-md">
                20% OFF
              </Badge>
            </button>
          </div>
          
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center max-w-md">
            Economize mais com o plano anual e tenha acesso a todos os recursos premium
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default BillingPeriodToggle;
