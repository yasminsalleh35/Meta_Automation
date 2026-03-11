
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { openaiService } from '@/services/openaiService';
import { useAIConfig } from './useAIConfig';
import { useAIRateLimit } from './useAIRateLimit';
import { useAICache } from './useAICache';

interface AISuggestion {
  interests: string[];
  adText: string;
  adTitle: string;
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

export const useAISuggestionsCore = () => {
  const { toast } = useToast();
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion | null>(null);
  
  const { checkAIConfig, showConfigError } = useAIConfig();
  const { checkRateLimit } = useAIRateLimit();
  const { getCachedSuggestions, saveSuggestionsToCache } = useAICache();

  const handleAISuggestion = async (
    objective: string, 
    onSuggestionsReceived?: (suggestions: AISuggestion) => void
  ) => {
    console.log('handleAISuggestion chamado com objetivo:', objective);

    if (!objective) {
      toast({
        title: "Selecione um objetivo",
        description: "Por favor, selecione o objetivo da campanha antes de usar a Camply IA.",
        variant: "destructive"
      });
      return;
    }

    // Verificar rate limit
    const userId = 'user_1'; // TODO: Pegar do contexto de auth
    const userPlan = 'free'; // TODO: Pegar do contexto de assinatura
    
    if (!checkRateLimit(userId, userPlan, 'ai_suggestion')) {
      return;
    }

    // Verificar cache primeiro
    const cachedSuggestions = await getCachedSuggestions(objective);
    
    if (cachedSuggestions) {
      console.log('Usando sugestões do cache');
      setAiSuggestions(cachedSuggestions);
      
      if (onSuggestionsReceived) {
        onSuggestionsReceived(cachedSuggestions);
      }

      toast({
        title: "Sugestões carregadas do cache!",
        description: "Sugestões recuperadas rapidamente do cache local.",
      });
      return;
    }

    // Verificar configuração da IA
    const configCheck = await checkAIConfig();
    
    if (!configCheck.isValid) {
      console.log('Configuração inválida:', configCheck.message);
      showConfigError(configCheck.message || 'IA não configurada');
      return;
    }

    console.log('Configuração válida, prosseguindo com a geração...');

    setIsAILoading(true);
    setAiSuggestions(null);

    try {
      console.log('Iniciando consulta à Camply IA...');
      const suggestions = await openaiService.generateCampaignSuggestions(objective);
      console.log('Sugestões recebidas:', suggestions);
      
      setAiSuggestions(suggestions);
      
      // Salvar no cache
      await saveSuggestionsToCache(objective, suggestions);
      
      if (onSuggestionsReceived) {
        onSuggestionsReceived(suggestions);
      }

      const remaining = checkRateLimit(userId, userPlan, 'ai_suggestion') ? 'várias' : '0';
      
      toast({
        title: "Sugestões da Camply IA geradas!",
        description: `Sugestões inteligentes geradas. Restam ${remaining} consultas nesta hora.`,
      });
    } catch (error) {
      console.error('Erro ao gerar sugestões:', error);
      toast({
        title: "Erro ao gerar sugestões",
        description: error instanceof Error ? error.message : "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsAILoading(false);
    }
  };

  return {
    isAILoading,
    aiSuggestions,
    handleAISuggestion
  };
};
