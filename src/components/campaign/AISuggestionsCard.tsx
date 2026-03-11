
import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  MapPin, 
  Users, 
  DollarSign, 
  Calendar,
  Target,
  Eye,
  EyeOff,
  MessageCircle
} from 'lucide-react';

interface AISuggestion {
  interests: string[];
  adText: string;
  audienceInsights: string;
  budgetRecommendation: string;
  location: {
    state: string;
    city: string;
  };
  audience: {
    gender: 'all' | 'male' | 'female';
    ageMin: number;
    ageMax: number;
  };
  budget: {
    daily: number;
    total: number;
  };
  duration: {
    startDate: string;
    endDate: string;
  };
}

interface AISuggestionsCardProps {
  isLoading: boolean;
  suggestions: AISuggestion | null;
  hasObjective: boolean;
  onGenerateSuggestions: () => void;
  onApplySuggestions?: (suggestions: AISuggestion) => void;
}

export const AISuggestionsCard: React.FC<AISuggestionsCardProps> = ({
  isLoading,
  suggestions,
  hasObjective,
  onGenerateSuggestions,
  onApplySuggestions
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const getAIConfigStatus = () => {
    try {
      const configStr = localStorage.getItem('camply_ai_config');
      console.log('Config string no card:', configStr);
      
      if (!configStr) {
        return { isValid: false, message: 'Configuração não encontrada' };
      }
      
      const aiConfig = JSON.parse(configStr);
      console.log('Config parseada no card:', aiConfig);
      
      if (!aiConfig.enabled) {
        return { isValid: false, message: 'IA desabilitada' };
      }
      
      if (!aiConfig.apiKey || aiConfig.apiKey.trim() === '') {
        return { isValid: false, message: 'API Key não configurada' };
      }
      
      return { isValid: true, message: 'Configuração válida' };
    } catch (error) {
      console.error('Erro ao verificar config da IA:', error);
      return { isValid: false, message: 'Erro na configuração' };
    }
  };

  const aiStatus = getAIConfigStatus();
  console.log('Status da IA no card:', aiStatus);

  const hasBusinessData = !!localStorage.getItem('camply_business_data');

  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male': return 'Masculino';
      case 'female': return 'Feminino';
      default: return 'Todos';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const handleApplySuggestions = () => {
    if (suggestions && onApplySuggestions) {
      onApplySuggestions(suggestions);
    }
  };

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">Sugestões Inteligentes para WhatsApp</h3>
                <p className="text-sm text-green-700">
                  Use Camply IA para otimizar sua campanha de geração de clientes no WhatsApp
                </p>
              </div>
            </div>
            <Button 
              onClick={onGenerateSuggestions} 
              disabled={isLoading || !aiStatus.isValid}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Gerando...
                </>
              ) : (
                <>
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Gerar Sugestões
                </>
              )}
            </Button>
          </div>

          {!aiStatus.isValid && (
            <Alert className="border-orange-200 bg-orange-50">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-orange-700">
                <div className="space-y-2">
                  <p>
                    Configure a Camply IA em <strong>"Configurações Admin → Integração de IA"</strong> para usar este recurso.
                  </p>
                  <div className="text-sm text-orange-600">
                    Status atual: {aiStatus.message} ✗
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {aiStatus.isValid && !hasBusinessData && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertCircle className="w-4 h-4 text-blue-600" />
              <AlertDescription className="text-blue-700">
                Para melhores sugestões da Camply IA, preencha suas informações em 
                <strong> "Meu Negócio"</strong> primeiro.
              </AlertDescription>
            </Alert>
          )}

          {suggestions && (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-700">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">✨ Sugestões otimizadas para WhatsApp geradas!</span>
                    <div className="flex space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-green-700 hover:text-green-800 hover:bg-green-100"
                      >
                        {showDetails ? (
                          <>
                            <EyeOff className="w-4 h-4 mr-1" />
                            Ocultar
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-1" />
                            Ver Detalhes
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleApplySuggestions}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Target className="w-4 h-4 mr-1" />
                        Aplicar Tudo
                      </Button>
                    </div>
                  </div>
                </AlertDescription>
              </Alert>

              {showDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Localização */}
                  <Card className="border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">Localização</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Estado:</strong> {suggestions.location.state}</p>
                        <p><strong>Cidade:</strong> {suggestions.location.city === 'all' ? 'Todas as cidades' : suggestions.location.city}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Público-Alvo */}
                  <Card className="border-purple-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Users className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-900">Público-Alvo</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Gênero:</strong> {getGenderLabel(suggestions.audience.gender)}</p>
                        <p><strong>Idade:</strong> {suggestions.audience.ageMin} - {suggestions.audience.ageMax} anos</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Orçamento */}
                  <Card className="border-green-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-900">Orçamento</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Diário:</strong> R$ {suggestions.budget.daily}</p>
                        <p><strong>Total:</strong> R$ {suggestions.budget.total}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Duração */}
                  <Card className="border-orange-200">
                    <CardContent className="pt-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Calendar className="w-4 h-4 text-orange-600" />
                        <span className="font-medium text-orange-900">Duração</span>
                      </div>
                      <div className="text-sm space-y-1">
                        <p><strong>Início:</strong> {formatDate(suggestions.duration.startDate)}</p>
                        <p><strong>Fim:</strong> {formatDate(suggestions.duration.endDate)}</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Interesses */}
              {suggestions.interests.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">🎯 Interesses para Clientes WhatsApp:</h4>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.interests.map((interest, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Insights e Recomendações */}
              <div className="space-y-3">
                {suggestions.audienceInsights && (
                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <h4 className="font-medium text-indigo-900 mb-1">💡 Insights para Conversão WhatsApp:</h4>
                    <p className="text-sm text-indigo-700">{suggestions.audienceInsights}</p>
                  </div>
                )}

                {suggestions.budgetRecommendation && (
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <h4 className="font-medium text-emerald-900 mb-1">💰 Orçamento para Leads WhatsApp:</h4>
                    <p className="text-sm text-emerald-700">{suggestions.budgetRecommendation}</p>
                  </div>
                )}

                {suggestions.adText && (
                  <div className="p-3 bg-amber-50 rounded-lg">
                    <h4 className="font-medium text-amber-900 mb-1">📱 Texto Otimizado para WhatsApp:</h4>
                    <p className="text-sm text-amber-700 italic">"{suggestions.adText}"</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
