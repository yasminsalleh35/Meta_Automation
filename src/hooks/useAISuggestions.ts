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

export const useAISuggestions = () => {
  const [isAILoading, setIsAILoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<AISuggestion | null>(null);
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

    try {
      console.log('🤖 Solicitando sugestões de IA via Edge Function...');
      
      // Chamar edge function usando cliente AI com timeout estendido
      const { data, error } = await supabaseAI.functions.invoke('ai-suggestions', {
        body: { objective }
      });

      if (error) {
        console.error('❌ Erro na Edge Function:', error);
        throw new Error(error.message || 'Erro ao processar sugestões de IA');
      }

      if (!data) {
        throw new Error('Nenhuma sugestão retornada pela IA');
      }

      console.log('✅ Sugestões recebidas:', data);
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
      
      let errorMessage = 'Erro ao gerar sugestões de IA';
      
      if (error instanceof Error) {
        if (error.message.includes('não configurada') || error.message.includes('não encontrada')) {
          errorMessage = 'IA não configurada. Entre em contato com o administrador para configurar a integração de IA.';
        } else if (error.message.includes('API Key inválida')) {
          errorMessage = 'Configuração de IA inválida. Entre em contato com o administrador.';
        } else if (error.message.includes('Limite de requisições')) {
          errorMessage = 'Limite de requisições atingido. Tente novamente em alguns minutos.';
        } else if (error.message.includes('sem créditos')) {
          errorMessage = 'Sem créditos disponíveis na conta de IA. Entre em contato com o administrador.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro na IA",
        description: errorMessage,
        variant: "destructive"
      });
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
    handleAISuggestion,
    checkAIStatus,
    // Manter compatibilidade com hooks antigos
    isGeneratingImage: false,
    generateImage: async () => {},
    getUsageStats: () => ({ requests: 0, limit: 100 })
  };
};
