
import { openaiService } from './openaiService';

export interface CampaignAnalysis {
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

export class CampaignAnalysisService {
  async analyzeCampaign(campaign: CampaignData): Promise<CampaignAnalysis> {
    console.log('Iniciando análise de campanha:', campaign.name);
    
    try {
      // Usar o OpenAIService que já gerencia os provedores
      return await openaiService.analyzeCampaign(campaign);
    } catch (error) {
      console.error('Erro ao analisar campanha:', error);
      
      // Melhorar a mensagem de erro para o usuário
      let errorMessage = 'Falha na análise da campanha';
      
      if (error instanceof Error) {
        if (error.message.includes('não está configurada')) {
          errorMessage = 'IA não configurada. Acesse as configurações de admin para configurar OpenAI ou DeepSeek.';
        } else if (error.message.includes('API Key inválida')) {
          errorMessage = 'Chave de API inválida. Verifique sua configuração de IA.';
        } else if (error.message.includes('Limite de requisições')) {
          errorMessage = 'Limite de requisições atingido. Tente novamente em alguns minutos.';
        } else if (error.message.includes('sem créditos')) {
          errorMessage = 'Conta sem créditos. Adicione créditos na sua conta de IA.';
        } else {
          errorMessage = `Erro na análise: ${error.message}`;
        }
      }
      
      throw new Error(errorMessage);
    }
  }
}

export const campaignAnalysisService = new CampaignAnalysisService();
