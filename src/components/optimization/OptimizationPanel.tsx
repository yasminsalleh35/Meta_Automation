import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Lightbulb,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Loader2,
  X,
  ChevronRight,
  History,
  RefreshCw,
} from 'lucide-react';
import {
  useOptimizationSuggestions,
  OptimizationSuggestion,
} from '@/hooks/useOptimizationSuggestions';

interface OptimizationPanelProps {
  campaignId: string;
}

export const OptimizationPanel: React.FC<OptimizationPanelProps> = ({ campaignId }) => {
  const {
    pendingSuggestions,
    appliedSuggestions,
    isLoading,
    isEvaluating,
    isApplying,
    fetchSuggestions,
    evaluateMetrics,
    applySuggestion,
    dismissSuggestion,
  } = useOptimizationSuggestions(campaignId);

  const [showApplied, setShowApplied] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'danger': return TrendingDown;
      default: return Lightbulb;
    }
  };

  const getColorClasses = (severity: string) => {
    switch (severity) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'danger': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getBadgeVariant = (severity: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (severity) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'danger': return 'destructive';
      default: return 'outline';
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      increase_budget: 'Orçamento',
      decrease_budget: 'Orçamento',
      pause_campaign: 'Pausar',
      activate_campaign: 'Ativar',
      adjust_targeting: 'Segmentação',
      duplicate_campaign: 'Duplicar',
      update_creative: 'Criativo',
      general: 'Geral',
    };
    return labels[type] || type;
  };

  const isActionable = (suggestion: OptimizationSuggestion) => {
    const actionableTypes = ['increase_budget', 'decrease_budget', 'pause_campaign', 'activate_campaign', 'duplicate_campaign'];
    return actionableTypes.includes(suggestion.type);
  };

  const handleApply = (suggestionId: string) => {
    if (confirmId === suggestionId) {
      applySuggestion(suggestionId);
      setConfirmId(null);
    } else {
      setConfirmId(suggestionId);
      // Auto-clear confirmation after 5 seconds
      setTimeout(() => setConfirmId(prev => prev === suggestionId ? null : prev), 5000);
    }
  };

  const renderSuggestion = (suggestion: OptimizationSuggestion, showActions = true) => {
    const IconComponent = getIcon(suggestion.severity);
    const applying = isApplying === suggestion.id;
    const confirming = confirmId === suggestion.id;

    return (
      <div
        key={suggestion.id}
        className={`p-4 rounded-lg border ${getColorClasses(suggestion.severity)} hover:shadow-md transition-all`}
      >
        <div className="flex items-start space-x-3">
          <IconComponent className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-2">
              <h4 className="font-semibold text-gray-900 text-sm">{suggestion.title}</h4>
              <Badge variant={getBadgeVariant(suggestion.severity)} className="text-xs">
                {getTypeLabel(suggestion.type)}
              </Badge>
              {suggestion.ai_provider && suggestion.ai_provider !== 'none' && (
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  {suggestion.ai_provider}
                </Badge>
              )}
              {suggestion.status === 'applied' && (
                <Badge variant="default" className="text-xs bg-green-600">
                  Aplicada
                </Badge>
              )}
            </div>
            <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>

            {showActions && suggestion.status === 'pending' && (
              <div className="flex items-center gap-2">
                {isActionable(suggestion) && (
                  <Button
                    variant={confirming ? 'default' : 'outline'}
                    size="sm"
                    className={`text-xs ${confirming ? 'bg-orange-500 hover:bg-orange-600' : ''}`}
                    disabled={applying}
                    onClick={() => handleApply(suggestion.id)}
                  >
                    {applying ? (
                      <>
                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                        Aplicando...
                      </>
                    ) : confirming ? (
                      'Confirmar aplicação'
                    ) : (
                      <>
                        Aplicar
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-gray-500"
                  onClick={() => dismissSuggestion(suggestion.id)}
                >
                  <X className="w-3 h-3 mr-1" />
                  Descartar
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg font-bold text-gray-900">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            Otimizações com IA
          </CardTitle>
          <div className="flex items-center gap-2">
            {appliedSuggestions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs"
                onClick={() => setShowApplied(!showApplied)}
              >
                <History className="w-3 h-3 mr-1" />
                {showApplied ? 'Ocultar histórico' : `Histórico (${appliedSuggestions.length})`}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={evaluateMetrics}
              disabled={isEvaluating}
              className="text-xs"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  Analisando...
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Avaliar com IA
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            <span className="ml-2 text-sm text-gray-600">Carregando sugestões...</span>
          </div>
        ) : pendingSuggestions.length === 0 && !isEvaluating ? (
          <div className="text-center py-8">
            <Lightbulb className="w-10 h-10 text-purple-300 mx-auto mb-3" />
            <p className="text-sm text-gray-600 mb-3">
              Nenhuma sugestão de otimização no momento.
            </p>
            <Button
              variant="default"
              size="sm"
              onClick={evaluateMetrics}
              disabled={isEvaluating}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Analisar campanha com IA
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {isEvaluating && (
              <div className="flex items-center justify-center py-4 border border-purple-200 rounded-lg bg-purple-50/50">
                <Loader2 className="w-5 h-5 animate-spin text-purple-600 mr-2" />
                <span className="text-sm text-purple-700">
                  A IA está analisando as métricas da campanha...
                </span>
              </div>
            )}
            {pendingSuggestions.map(s => renderSuggestion(s, true))}
          </div>
        )}

        {/* Applied suggestions history */}
        {showApplied && appliedSuggestions.length > 0 && (
          <div className="mt-4 pt-4 border-t border-purple-200">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Otimizações aplicadas</h4>
            <div className="space-y-2 opacity-70">
              {appliedSuggestions.map(s => renderSuggestion(s, false))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
