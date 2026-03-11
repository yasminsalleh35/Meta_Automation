
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, TrendingUp, Calculator } from 'lucide-react';
import { RealCampaign } from '@/types/realCampaign';

interface CampaignBudgetInfoProps {
  campaign: RealCampaign;
}

export const CampaignBudgetInfo: React.FC<CampaignBudgetInfoProps> = ({ campaign }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const calculateDailyBudgetPercentage = () => {
    if (!campaign.budget_total || campaign.budget_total === 0) return 0;
    return ((campaign.budget_daily / campaign.budget_total) * 100).toFixed(1);
  };

  const estimateCampaignDuration = () => {
    if (!campaign.budget_total || campaign.budget_daily === 0) return 'Indefinido';
    const days = Math.floor(campaign.budget_total / campaign.budget_daily);
    return `${days} ${days === 1 ? 'dia' : 'dias'}`;
  };

  return (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="w-5 h-5 text-green-600" />
          Orçamento e Investimento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-green-600" />
              <p className="text-sm font-medium text-green-700">Orçamento Diário</p>
            </div>
            <p className="text-2xl font-bold text-green-800">{formatCurrency(campaign.budget_daily)}</p>
            <p className="text-xs text-green-600 mt-1">
              {calculateDailyBudgetPercentage()}% do orçamento total
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-medium text-blue-700">Orçamento Total</p>
            </div>
            <p className="text-2xl font-bold text-blue-800">{formatCurrency(campaign.budget_total)}</p>
            <p className="text-xs text-blue-600 mt-1">
              Limite máximo de gasto
            </p>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex items-center gap-2 mb-2">
              <Calculator className="w-4 h-4 text-purple-600" />
              <p className="text-sm font-medium text-purple-700">Duração Estimada</p>
            </div>
            <p className="text-2xl font-bold text-purple-800">{estimateCampaignDuration()}</p>
            <p className="text-xs text-purple-600 mt-1">
              Com orçamento atual
            </p>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">
              <strong>Análise de Orçamento:</strong>
            </p>
            <ul className="text-xs text-gray-700 space-y-1">
              <li>• Orçamento diário representa {calculateDailyBudgetPercentage()}% do total</li>
              <li>• Campanha pode durar aproximadamente {estimateCampaignDuration()}</li>
              <li>• Gasto máximo diário: {formatCurrency(campaign.budget_daily)}</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
