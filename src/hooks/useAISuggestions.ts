import { useState } from 'react';
import { supabaseAI } from '@/integrations/supabase/aiClient';
import { useToast } from '@/hooks/use-toast';

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

const AI_UNAVAILABLE_TITLE = 'Sugestões indisponíveis no momento';
const AI_UNAVAILABLE_DESCRIPTION = 'Você pode continuar preenchendo a campanha normalmente, sem a IA.';

export const useAISuggestions = () => {
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion | null>(null);
  const [aiUnavailable, setAiUnavailable] = useState(false);
  const { toast } = useToast();

  const handleAISuggestion = async (
    objective: string, 
    onSuggestionsReceived?: (suggestions: AISuggestion) => void
  ): Promise<void> => {
    if (!objective?.trim()) {
      toast({
        title: "Objetivo obrigatório",
        description: "Por favor, informe o objetivo da campanha antes de solicitar sugestões de IA.",
        variant: "destructive"
      });
      return;
    }

    setIsAILoading(true);
    setAiUnavailable(false);

    try {
      // Chamar edge function usando cliente AI com timeout estendido
      const { data, error } = await supabaseAI.functions.invoke('ai-suggestions', {
        body: { objective }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        const status = (error as { context?: Response }).context?.status;
        setAiUnavailable(true);
        toast({
          title: AI_UNAVAILABLE_TITLE,
          description: status === 429
            ? 'Limite de uso da IA atingido. Você pode continuar sem as sugestões e tentar mais tarde.'
            : AI_UNAVAILABLE_DESCRIPTION,
        });
        return;
      }

      // A função devolve sugestões genéricas com _source='fallback' quando a IA falha (audit CMP-15):
      // não aplicamos textos genéricos na campanha; o usuário segue sem IA.
      if (!data || data._source === 'fallback') {
        if (data?._warning) console.warn('IA indisponível:', data._warning);
        setAiUnavailable(true);
        toast({ title: AI_UNAVAILABLE_TITLE, description: AI_UNAVAILABLE_DESCRIPTION });
        return;
      }

      setAiSuggestions(data);
      
      // Chamar callback se fornecido
      if (onSuggestionsReceived) {
        onSuggestionsReceived(data);
      }

      toast({
        title: "Sugestões geradas!",
        description: "A IA analisou seu objetivo e gerou sugestões personalizadas.",
      });

    } catch (error) {
      console.error('❌ Erro ao gerar sugestões:', error);
      setAiUnavailable(true);
      toast({ title: AI_UNAVAILABLE_TITLE, description: AI_UNAVAILABLE_DESCRIPTION });
    } finally {
      setIsAILoading(false);
    }
  };

  // Função para verificar status da IA sem expor configurações
  const checkAIStatus = async () => {
    try {
      const { data, error } = await supabaseAI.rpc('get_ai_status');
      
      if (error) {
        console.error('Erro ao verificar status da IA:', error);
        return { isAvailable: false, message: 'Erro ao verificar configuração' };
      }

      const status = data?.[0];
      if (!status || !status.is_available) {
        return { 
          isAvailable: false, 
          message: 'IA não configurada pelo administrador' 
        };
      }

      return { 
        isAvailable: true, 
        provider: status.provider,
        model: status.model_name
      };
    } catch (error) {
      console.error('Erro ao verificar status da IA:', error);
      return { isAvailable: false, message: 'Erro na verificação' };
    }
  };

  return {
    isAILoading,
    aiSuggestions,
    aiUnavailable,
    handleAISuggestion,
    checkAIStatus,
    // Manter compatibilidade com hooks antigos
    isGeneratingImage: false,
    generateImage: async () => {},
    getUsageStats: () => ({ requests: 0, limit: 100 })
  };
};
