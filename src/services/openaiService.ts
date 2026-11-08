
// audit CMP-15: o navegador não chama mais provedores de IA (OpenAI/DeepSeek) nem guarda chaves.
// Sugestões passam pela edge function `ai-suggestions`; a análise de campanha usa regras locais.

interface BusinessData {
  name: string;
  description: string;
  mainProduct: string;
  category: string;
  targetAudience: string;
  businessGoals: string;
}

interface CampaignSuggestion {
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

interface CampaignAnalysis {
  performanceScore: number;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  summary: string;
  nextActions: string[];
}

interface CampaignData {
  id: string;
  name: string;
  objective: string;
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  leads: number;
  ctr: number;
  cpa: number;
  roas: number;
  startDate: string;
  endDate?: string;
}

export const AI_UNAVAILABLE_MESSAGE = 'Sugestões indisponíveis no momento';

export class OpenAIService {
  async analyzeCampaign(campaign: CampaignData): Promise<CampaignAnalysis> {
    return this.generateFallbackAnalysis(campaign);
  }

  private calculateBasicScore(campaign: CampaignData): number {
    let score = 50;

    if (campaign.ctr > 3) score += 20;
    else if (campaign.ctr > 2) score += 10;
    else if (campaign.ctr < 1) score -= 15;

    if (campaign.roas > 4) score += 25;
    else if (campaign.roas > 3) score += 15;
    else if (campaign.roas > 2) score += 5;
    else if (campaign.roas < 2) score -= 20;

    const spentPercentage = campaign.budget > 0 ? (campaign.spent / campaign.budget) * 100 : 0;
    if (spentPercentage > 90 && spentPercentage <= 100) score += 5;
    else if (spentPercentage < 50) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  private generateFallbackAnalysis(campaign: CampaignData): CampaignAnalysis {
    const score = this.calculateBasicScore(campaign);

    return {
      performanceScore: score,
      strengths: campaign.ctr > 2 ? ['Taxa de cliques acima da média'] : [],
      weaknesses: campaign.roas < 2 ? ['Retorno sobre investimento baixo'] : [],
      recommendations: [
        'Revise o público-alvo da campanha',
        'Teste diferentes criativos',
        'Ajuste o orçamento baseado no desempenho'
      ],
      summary: `Campanha com score de ${score}/100. ${score > 70 ? 'Bom desempenho geral.' : score > 50 ? 'Desempenho médio, há oportunidades de melhoria.' : 'Precisa de otimizações urgentes.'}`,
      nextActions: [
        'Monitorar métricas diariamente',
        'Implementar as recomendações sugeridas'
      ]
    };
  }

  async generateCampaignSuggestions(objective: string): Promise<CampaignSuggestion> {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data, error } = await supabase.functions.invoke('ai-suggestions', {
      body: { objective }
    });

    if (error || !data || data._source === 'fallback') {
      throw new Error(AI_UNAVAILABLE_MESSAGE);
    }

    return data as CampaignSuggestion;
  }

  async getBusinessData(): Promise<BusinessData | null> {
    try {
      const { supabase } = await import('@/integrations/supabase/client');

      const { data: session } = await supabase.auth.getSession();

      if (session?.session) {
        const { data, error } = await supabase
          .from('business_settings')
          .select('*')
          .eq('user_id', session.session.user.id)
          .maybeSingle();

        if (!error && data) {
          const businessData = {
            name: data.business_name || '',
            description: data.business_description || '',
            mainProduct: data.main_product || '',
            category: data.category || '',
            targetAudience: data.target_audience || '',
            businessGoals: data.business_goals || ''
          };

          if (businessData.name || businessData.description) {
            return businessData;
          }
        }
      }

      // Fallback para localStorage
      const businessStr = localStorage.getItem('camply_business_data');
      if (businessStr) {
        const localData = JSON.parse(businessStr);

        if (localData.name || localData.description) {
          return localData;
        }
      }

      return null;
    } catch (error) {
      console.error('Erro ao carregar dados do negócio:', error);

      const businessStr = localStorage.getItem('camply_business_data');
      if (businessStr) {
        try {
          return JSON.parse(businessStr);
        } catch (parseError) {
          console.error('Erro ao fazer parse dos dados do localStorage:', parseError);
        }
      }
      return null;
    }
  }
}

export const openaiService = new OpenAIService();
