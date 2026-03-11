
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Sparkles, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { openaiService } from '@/services/openaiService';
import { useToast } from '@/hooks/use-toast';
import { BudgetUtils, BUDGET_CONSTANTS } from '@/services/metaAds/utils/budgetUtils';

interface BudgetSettingsCardProps {
  budget: {
    daily: number;
  };
  onBudgetChange: (value: number) => void;
  isAILoading?: boolean;
}

export const BudgetSettingsCard: React.FC<BudgetSettingsCardProps> = ({
  budget,
  onBudgetChange,
  isAILoading = false
}) => {
  const { toast } = useToast();
  const [isGeneratingBudget, setIsGeneratingBudget] = React.useState(false);

  // Validação em tempo real
  const budgetValidation = React.useMemo(() => {
    return BudgetUtils.validateDailyBudget(budget.daily);
  }, [budget.daily]);

  const generateBudgetSuggestion = async () => {
    setIsGeneratingBudget(true);
    try {
      const suggestions = await openaiService.generateCampaignSuggestions('advantage_plus_leads');
      if (suggestions.budget) {
        onBudgetChange(suggestions.budget.daily);
        toast({
          title: "Orçamento sugerido!",
          description: "Orçamento personalizado baseado nas informações do seu negócio.",
        });
      }
    } catch (error) {
      console.error('Erro ao gerar orçamento:', error);
      // Fallback para sugestão simples
      const budgetSuggestions = [50, 75, 100, 150, 200];
      const randomBudget = budgetSuggestions[Math.floor(Math.random() * budgetSuggestions.length)];
      onBudgetChange(randomBudget);
      
      toast({
        title: "Orçamento sugerido",
        description: "Configure a Camply IA nas configurações para sugestões personalizadas.",
        variant: "default"
      });
    } finally {
      setIsGeneratingBudget(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span>Orçamento Diário</span>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={generateBudgetSuggestion}
            disabled={isAILoading || isGeneratingBudget}
          >
            {isGeneratingBudget ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 mr-2" />
            )}
            {isGeneratingBudget ? 'Gerando...' : 'Sugerir'}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <Label htmlFor="dailyBudget">Valor por dia (R$)</Label>
            <div className="relative">
              <Input
                id="dailyBudget"
                type="number"
                min={BUDGET_CONSTANTS.MIN_DAILY_BRL}
                max={BUDGET_CONSTANTS.MAX_DAILY_BRL}
                value={budget.daily}
                onChange={(e) => onBudgetChange(parseFloat(e.target.value) || BUDGET_CONSTANTS.MIN_DAILY_BRL)}
                placeholder="50"
                className={
                  !budgetValidation.isValid ? 'border-red-500 focus:border-red-500' : ''
                }
              />
              {budgetValidation.isValid ? (
                <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-red-500" />
              )}
            </div>
            {!budgetValidation.isValid && (
              <p className="text-sm text-red-600 mt-1">{budgetValidation.error}</p>
            )}
          </div>
          <div className="text-right">
            <Badge 
              variant={budgetValidation.isValid ? "secondary" : "destructive"} 
              className="text-lg"
            >
              R$ {budget.daily}/dia
            </Badge>
            <p className="text-sm text-gray-500 mt-1">
              ~R$ {(budget.daily * 30).toFixed(0)}/mês
            </p>
          </div>
        </div>
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600">Mínimo</p>
              <p className="font-semibold text-orange-600">R$ {BUDGET_CONSTANTS.MIN_DAILY_BRL}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Recomendado</p>
              <p className="font-semibold text-green-600">R$ 50-100</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Alto Volume</p>
              <p className="font-semibold text-blue-600">R$ 150+</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
