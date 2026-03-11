
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Lightbulb, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CheckCircle,
  DollarSign,
  Target,
  ChevronRight
} from 'lucide-react';

interface AISuggestion {
  id: string;
  type: 'success' | 'warning' | 'danger' | 'info';
  title: string;
  description: string;
  actionText?: string;
  campaignId?: string;
}

interface AISuggestionsSectionProps {
  metrics: any;
  campaigns: any[];
}

export const AISuggestionsSection: React.FC<AISuggestionsSectionProps> = ({
  metrics,
  campaigns
}) => {
  const generateSuggestions = (): AISuggestion[] => {
    const suggestions: AISuggestion[] = [];

    // Análise de CPL
    if (metrics.cpa > 50) {
      suggestions.push({
        id: 'high-cpl',
        type: 'warning',
        title: 'Custo por lead alto detectado',
        description: `Seu CPL atual é R$ ${metrics.cpa.toFixed(2)}. Considere ajustar segmentação ou criativos.`,
        actionText: 'Otimizar campanhas'
      });
    } else if (metrics.cpa < 20 && metrics.cpa > 0) {
      suggestions.push({
        id: 'good-cpl',
        type: 'success',
        title: 'Excelente custo por lead!',
        description: `Seu CPL de R$ ${metrics.cpa.toFixed(2)} está ótimo. Considere aumentar o orçamento.`,
        actionText: 'Aumentar orçamento'
      });
    }

    // Análise de CTR
    if (metrics.ctr < 1.0 && metrics.ctr > 0) {
      suggestions.push({
        id: 'low-ctr',
        type: 'warning',
        title: 'Taxa de cliques baixa',
        description: `CTR de ${metrics.ctr.toFixed(2)}%. Use criativos mais atrativos e chamadas claras.`,
        actionText: 'Melhorar criativos'
      });
    }

    // Análise de campanhas ativas
    if (metrics.activeCampaigns === 0) {
      suggestions.push({
        id: 'no-campaigns',
        type: 'info',
        title: 'Comece sua jornada!',
        description: 'Você ainda não tem campanhas ativas. Crie sua primeira campanha para começar a gerar leads.',
        actionText: 'Criar campanha'
      });
    } else if (metrics.activeCampaigns > 5) {
      suggestions.push({
        id: 'many-campaigns',
        type: 'info',
        title: 'Muitas campanhas ativas',
        description: 'Com muitas campanhas, foque nas que trazem melhores resultados.',
        actionText: 'Analisar performance'
      });
    }

    // Análise de ROAS
    if (metrics.roas > 3) {
      suggestions.push({
        id: 'good-roas',
        type: 'success',
        title: 'Retorno excelente!',
        description: `ROAS de ${metrics.roas.toFixed(1)}x indica campanhas muito rentáveis.`,
        actionText: 'Escalar investimento'
      });
    }

    return suggestions.slice(0, 3); // Mostrar no máximo 3 sugestões
  };

  const suggestions = generateSuggestions();

  const getIcon = (type: string) => {
    switch (type) {
      case 'success': return CheckCircle;
      case 'warning': return AlertTriangle;
      case 'danger': return TrendingDown;
      default: return Lightbulb;
    }
  };

  const getColorClasses = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'danger': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'success': return 'default';
      case 'warning': return 'secondary';
      case 'danger': return 'destructive';
      default: return 'outline';
    }
  };

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">
          <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3 text-purple-600" />
          O que a IA recomenda?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {suggestions.map((suggestion) => {
            const IconComponent = getIcon(suggestion.type);
            return (
              <div 
                key={suggestion.id}
                className={`p-4 rounded-lg border ${getColorClasses(suggestion.type)} hover:shadow-md transition-shadow`}
              >
                <div className="flex items-start space-x-3">
                  <IconComponent className="w-5 h-5 text-gray-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                      <Badge variant={getBadgeVariant(suggestion.type)} className="text-xs">
                        IA
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-700 mb-3">{suggestion.description}</p>
                    {suggestion.actionText && (
                      <Button variant="outline" size="sm" className="text-xs">
                        {suggestion.actionText}
                        <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
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
