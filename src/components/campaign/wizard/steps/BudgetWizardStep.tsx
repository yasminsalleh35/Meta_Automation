
import React, { useMemo } from 'react';
import { DollarSign, TrendingUp, Lightbulb, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CampaignData } from '@/types/campaign';
import { BudgetUtils, BUDGET_CONSTANTS } from '@/services/metaAds/utils/budgetUtils';

interface BudgetWizardStepProps {
  campaignData: CampaignData;
  updateCampaignData: (field: keyof CampaignData, value: any) => void;
  onAISuggestion?: () => void;
  isAILoading?: boolean;
  handleApplySuggestions?: (suggestions: any) => void;
  aiSuggestions?: any;
  isLocationValid?: () => boolean;
}

export const BudgetWizardStep: React.FC<BudgetWizardStepProps> = ({
  campaignData,
  updateCampaignData,
  onAISuggestion,
  isAILoading = false
}) => {
  const handleBudgetChange = (value: number) => {
    updateCampaignData('budget', { 
      ...campaignData.budget, 
      daily: value,
      total: value * 30
    });
  };

  // Validação em tempo real do orçamento
  const budgetValidation = useMemo(() => {
    return BudgetUtils.validateDailyBudget(campaignData.budget.daily);
  }, [campaignData.budget.daily]);

  // Recomendação do orçamento
  const budgetRecommendation = useMemo(() => {
    if (budgetValidation.isValid) {
      return BudgetUtils.getBudgetRecommendation(campaignData.budget.daily);
    }
    return null;
  }, [campaignData.budget.daily, budgetValidation.isValid]);

  // Cálculos precisos baseados em CPM de R$ 15 e CTR de 2,5%
  const calculateMetrics = (dailyBudget: number) => {
    if (!budgetValidation.isValid) {
      return { reach: 0, clicks: 0, conversations: 0 };
    }

    const cpm = 15; // CPM de R$ 15
    const ctr = 0.025; // CTR de 2,5%
    
    const dailyReach = Math.round((dailyBudget / cpm) * 1000);
    const dailyClicks = Math.round(dailyReach * ctr);
    const conversationRate = 0.15; // 15% dos cliques iniciam conversa
    const dailyConversations = Math.round(dailyClicks * conversationRate);
    
    return {
      reach: dailyReach,
      clicks: dailyClicks,
      conversations: dailyConversations
    };
  };

  const metrics = calculateMetrics(campaignData.budget.daily);

  const budgetPresets = [
    { label: 'Começando', value: 50, description: 'Para testar e aprender' },
    { label: 'Crescendo', value: 100, description: 'Para resultados consistentes' },
    { label: 'Acelerando', value: 200, description: 'Para máximo alcance' }
  ];

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="text-center space-y-3">
        <div className="mx-auto w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
          <DollarSign className="w-8 h-8 text-camply-green" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Quanto você quer investir por dia?
          </h2>
          <p className="text-gray-600 mt-2 max-w-md mx-auto">
            Defina um valor que caiba no seu bolso. Você pode ajustar a qualquer momento.
          </p>
        </div>
      </div>

      {/* Budget Presets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {budgetPresets.map((preset) => (
          <Card 
            key={preset.value}
            className={`cursor-pointer transition-all duration-200 border-2 hover:shadow-md ${
              campaignData.budget.daily === preset.value 
                ? 'border-camply-green bg-green-50 shadow-md' 
                : 'border-gray-200 hover:border-camply-green/50'
            }`}
            onClick={() => handleBudgetChange(preset.value)}
          >
            <CardContent className="pt-6 text-center">
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-900">{preset.label}</h3>
                <div className="text-2xl font-bold text-camply-green">
                  R$ {preset.value}/dia
                </div>
                <p className="text-sm text-gray-600">{preset.description}</p>
                <p className="text-xs text-gray-500">
                  ~R$ {preset.value * 30}/mês
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Custom Budget */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-lg text-gray-900">Ou defina um valor personalizado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Label htmlFor="customBudget" className="text-gray-700">Valor diário (R$)</Label>
              <div className="relative">
                <Input
                  id="customBudget"
                  type="number"
                  min={BUDGET_CONSTANTS.MIN_DAILY_BRL}
                  max={BUDGET_CONSTANTS.MAX_DAILY_BRL}
                  value={campaignData.budget.daily}
                  onChange={(e) => handleBudgetChange(parseFloat(e.target.value) || BUDGET_CONSTANTS.MIN_DAILY_BRL)}
                  placeholder="50"
                  className={`text-lg border-2 transition-colors ${
                    budgetValidation.isValid 
                      ? 'border-camply-green focus:border-camply-green' 
                      : 'border-red-300 focus:border-red-400'
                  }`}
                />
                {budgetValidation.isValid && (
                  <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-camply-green" />
                )}
              </div>
              {!budgetValidation.isValid && (
                <p className="text-sm text-red-600 mt-1">{budgetValidation.error}</p>
              )}
            </div>
            <div className="text-right">
              <Badge 
                className={`text-lg px-4 py-2 font-medium ${
                  budgetValidation.isValid 
                    ? 'bg-camply-green text-white' 
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                R$ {campaignData.budget.daily}/dia
              </Badge>
              <p className="text-sm text-gray-500 mt-1">
                ~R$ {(campaignData.budget.daily * 30).toFixed(0)}/mês
              </p>
            </div>
          </div>

          {/* Budget Recommendation */}
          {budgetRecommendation && (
            <div className={`p-4 rounded-lg border-2 ${
              budgetRecommendation.level === 'recommended' 
                ? 'bg-green-50 border-camply-green/30' 
                : budgetRecommendation.level === 'low'
                ? 'bg-yellow-50 border-yellow-300'
                : 'bg-blue-50 border-camply-blue/30'
            }`}>
              <p className={`text-sm font-medium ${
                budgetRecommendation.level === 'recommended' 
                  ? 'text-camply-green' 
                  : budgetRecommendation.level === 'low'
                  ? 'text-yellow-700'
                  : 'text-camply-blue'
              }`}>
                {budgetRecommendation.message}
              </p>
            </div>
          )}

          {/* Budget Impact Info */}
          {budgetValidation.isValid && (
            <div className="bg-blue-50 rounded-lg p-4 border border-camply-blue/20">
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-camply-blue mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-camply-blue mb-2">Estimativa com R$ {campaignData.budget.daily}/dia:</p>
                  <ul className="text-gray-700 space-y-1">
                    <li>• Aproximadamente <strong>{metrics.reach.toLocaleString()}</strong> pessoas alcançadas por dia</li>
                    <li>• Cerca de <strong>{metrics.clicks}</strong> cliques esperados</li>
                    <li>• Potencial de <strong>{metrics.conversations}</strong> conversas iniciadas via WhatsApp</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    *Estimativas baseadas em CPM de R$ 15 e CTR médio de 2,5%
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Limits Info */}
      <Alert className="border-camply-blue/20 bg-blue-50">
        <Lightbulb className="h-4 w-4 text-camply-blue" />
        <AlertDescription className="text-camply-blue">
          <strong>Limites do Meta Ads:</strong> Orçamento mínimo de R$ {BUDGET_CONSTANTS.MIN_DAILY_BRL}/dia 
          e máximo de R$ {BUDGET_CONSTANTS.MAX_DAILY_BRL.toLocaleString()}/dia. 
          Comece com valores menores para testar e aumente gradualmente conforme os resultados.
        </AlertDescription>
      </Alert>
    </div>
  );
};
