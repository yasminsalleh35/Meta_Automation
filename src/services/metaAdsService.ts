import { metaAdsAuthService } from './metaAds/MetaAdsAuthService';
import { metaAdsAccountService } from './metaAds/MetaAdsAccountService';
import { metaAdsCampaignService } from './metaAds/MetaAdsCampaignService';
import { metaAdsInsightsService } from './metaAds/MetaAdsInsightsService';
import { metaAdsCreativeEditService } from './metaAds/services/MetaAdsCreativeEditService';
import { instagramAutoRepairService } from './metaAds/services/InstagramAutoRepairService';
import { metaAdsLocationService } from './metaAds/MetaAdsLocationService';
import { CampaignCreationData, MetaCampaignResponse } from './metaAds/types';

// Main service that acts as a facade for all Meta Ads operations
export class MetaAdsService {
  // OAuth URL generation
  generateOAuthUrl(clientId: string, redirectUri: string): string {
    return metaAdsAuthService.generateOAuthUrl(clientId, redirectUri);
  }

  // Exchange code for access token server-side
  async exchangeCodeServerSide(code: string, redirectUri: string, state?: string) {
    return metaAdsAuthService.exchangeCodeServerSide(code, redirectUri, state);
  }

  // Get user's ad accounts
  async getAdAccounts(accessToken: string): Promise<any[]> {
    return metaAdsAccountService.getAdAccounts(accessToken);
  }

  // Get user's pages
  async getPages(accessToken: string): Promise<any[]> {
    return metaAdsAccountService.getPages(accessToken);
  }

  // Get WhatsApp Business accounts
  async getWhatsAppBusinessAccounts(accessToken: string): Promise<any[]> {
    return metaAdsAccountService.getWhatsAppBusinessAccounts(accessToken);
  }

  // Create complete campaign with Advantage+ settings
  async createAdvantageLeadCampaign(
    adAccountId: string, 
    pageId: string,
    campaignData: CampaignCreationData, 
    accessToken: string
  ): Promise<MetaCampaignResponse> {
    return metaAdsCampaignService.createAdvantageLeadCampaign(adAccountId, pageId, campaignData, accessToken);
  }

  // Get campaign insights
  async getCampaignInsights(adId: string, accessToken: string): Promise<any> {
    return metaAdsInsightsService.getCampaignInsights(adId, accessToken);
  }

  // NOVAS FUNCIONALIDADES DE EDIÇÃO DE CRIATIVOS
  
  // Verifica se um criativo tem Instagram configurado
  async checkCreativeInstagram(creativeId: string, accessToken: string): Promise<boolean> {
    return metaAdsCreativeEditService.hasInstagramConfigured(creativeId, accessToken);
  }

  // Atualiza Instagram em um criativo existente
  async updateCreativeInstagram(
    creativeId: string,
    instagramId: string,
    accessToken: string
  ): Promise<boolean> {
    return metaAdsCreativeEditService.updateCreativeInstagram(creativeId, instagramId, accessToken);
  }

  // Busca detalhes de um criativo
  async getCreativeDetails(creativeId: string, accessToken: string): Promise<any> {
    return metaAdsCreativeEditService.getCreativeDetails(creativeId, accessToken);
  }

  // Repara Instagram em uma campanha
  async repairCampaignInstagram(
    campaignId: string,
    campaignName: string,
    pageId: string,
    creativeIds: string[],
    accessToken: string
  ): Promise<any> {
    return instagramAutoRepairService.repairCampaignInstagram(
      campaignId,
      campaignName,
      pageId,
      creativeIds,
      accessToken
    );
  }

  // Encontra o melhor Instagram para uma página
  async findBestInstagramForPage(pageId: string, accessToken: string): Promise<string | null> {
    return instagramAutoRepairService.findBestInstagramForPage(pageId, accessToken);
  }

  // ✅ NOVO: Resolver cidade para obter key Meta
  async resolveCityToAdGeoKey(params: {
    query: string;
    countryCode: string;
    accessToken: string;
  }) {
    return metaAdsLocationService.resolveCityToAdGeoKey(params);
  }
}

export const metaAdsService = new MetaAdsService();
export { metaAdsLocationService };
