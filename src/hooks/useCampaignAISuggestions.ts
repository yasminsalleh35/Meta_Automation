
import { useToast } from '@/hooks/use-toast';
import { useAISuggestions } from '@/hooks/useAISuggestions';
import { CampaignData } from '@/types/campaign';

export const useCampaignAISuggestions = (
  campaignData: CampaignData,
  updateCampaignData: (field: keyof CampaignData, value: any) => void,
  updateLocationData: (field: string, value: any) => void
) => {
  const { toast } = useToast();
  const { isAILoading, aiSuggestions, handleAISuggestion } = useAISuggestions();

  const onAISuggestion = () => {
    handleAISuggestion(campaignData.objective);
  };

  const handleApplySuggestions = (suggestions: any) => {
    console.log('🤖 Aplicando sugestões automaticamente:', suggestions);
    
    // Aplicar localização
    if (suggestions.location) {
      updateLocationData('state', suggestions.location.state);
      updateLocationData('city', suggestions.location.city);
    }

    // Aplicar orçamento
    if (suggestions.budget) {
      updateCampaignData('budget', {
        daily: suggestions.budget.daily,
        total: suggestions.budget.total
      });
    }

    // Aplicar duração
    if (suggestions.duration) {
      updateCampaignData('duration', {
        startDate: suggestions.duration.startDate,
        endDate: suggestions.duration.endDate
      });
    }

    // Aplicar textos se disponíveis
    if (suggestions.adTitle) {
      updateCampaignData('adTitle', suggestions.adTitle);
    }
    
    if (suggestions.adText) {
      updateCampaignData('adText', suggestions.adText);
    }

    toast({
      title: "Sugestões aplicadas!",
      description: "Configurações otimizadas automaticamente para campanhas Advantage+.",
    });
  };

  return {
    isAILoading,
    aiSuggestions,
    onAISuggestion,
    handleApplySuggestions
  };
};
