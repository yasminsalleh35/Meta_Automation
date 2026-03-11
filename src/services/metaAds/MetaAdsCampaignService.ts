
import { metaAdsCreativeService } from './MetaAdsCreativeService';
import { CampaignCreationData, MetaCampaignResponse } from './types';
import { MetaAdsValidationUtils } from './utils/validationUtils';
import { CampaignConfigValidator } from './utils/CampaignConfigValidator';
import { campaignCreationService } from './services/CampaignCreationService';
import { adSetCreationService } from './services/AdSetCreationService';
import { AdCreativeCreationService } from './services/AdCreativeCreationService';
import { adCreationService } from './services/AdCreationService';

export class MetaAdsCampaignService {
  // Create complete campaign with corrected configuration
  async createAdvantageLeadCampaign(
    adAccountId: string, 
    pageId: string,
    campaignData: CampaignCreationData, 
    accessToken: string,
    onAdSetCreated?: (adSetId: string) => void
  ): Promise<MetaCampaignResponse> {
    try {
      console.log('🚀 Starting Meta Ads campaign creation with enhanced validation...');
      console.log('📊 Campaign data received:', {
        hasSelectedLocations: !!campaignData.selectedLocations,
        selectedLocationsCount: campaignData.selectedLocations?.length || 0,
        locationNames: campaignData.selectedLocations?.map(loc => loc.name) || [],
        location: campaignData.localizacao,
        daily_budget: campaignData.daily_budget,
        whatsappLink: campaignData.link_whatsapp,
        copy: campaignData.copy ? campaignData.copy.substring(0, 50) + '...' : 'No copy',
        pageId: pageId
      });
      
      // ✅ ENHANCED VALIDATION: WhatsApp campaign validation
      const whatsappValidation = CampaignConfigValidator.validateWhatsAppCampaign(campaignData);
      if (!whatsappValidation.isValid) {
        throw new Error(`Configuração WhatsApp inválida: ${whatsappValidation.error}`);
      }
      
      if (whatsappValidation.warnings && whatsappValidation.warnings.length > 0) {
        console.warn('⚠️ Configuration warnings:', whatsappValidation.warnings);
      }
      
      // ✅ VALIDAÇÃO CRÍTICA: Verificar selectedLocations
      if (!campaignData.selectedLocations || campaignData.selectedLocations.length === 0) {
        console.error('❌ ERRO CRÍTICO: selectedLocations não encontradas no campaignData');
        console.error('📋 Dados recebidos:', campaignData);
        throw new Error('Dados de localização não encontrados. Tente selecionar uma cidade novamente.');
      }

      // Validate campaign configuration compatibility
      const recommendedConfig = CampaignConfigValidator.getRecommendedConfig('whatsapp');
      console.log('📋 Using recommended WhatsApp campaign configuration:', recommendedConfig);
      
      // Validate compatibility
      const compatibilityCheck = CampaignConfigValidator.validateCampaignAdSetCompatibility(
        recommendedConfig.campaignObjective,
        recommendedConfig.optimizationGoal,
        recommendedConfig.billingEvent
      );
      
      if (!compatibilityCheck.isValid) {
        throw new Error(`Incompatibilidade de configuração: ${compatibilityCheck.error}`);
      }

      // Format the ad account ID properly
      const formattedAdAccountId = MetaAdsValidationUtils.formatAdAccountId(adAccountId);
      console.log('Formatted adAccountId:', formattedAdAccountId);

      const campaignName = MetaAdsValidationUtils.generateCampaignName();

      // Step 1: Create Campaign with OUTCOME_TRAFFIC objective
      console.log('📝 Step 1: Creating campaign with validated OUTCOME_TRAFFIC objective...');
      const campaignId = await campaignCreationService.createCampaign(
        formattedAdAccountId,
        campaignName,
        accessToken
      );

      // Step 2: Create AdSet with validated configuration
      console.log('📝 Step 2: Creating AdSet with validated configuration...');
      const adsetId = await adSetCreationService.createAdSet(
        formattedAdAccountId,
        campaignId,
        campaignName,
        pageId,
        campaignData,
        accessToken
      );

      // Trigger Ad Set verification integration
      if (onAdSetCreated) {
        console.log('🔗 Triggering Ad Set verification integration...');
        onAdSetCreated(adsetId);
      }

      // Step 3: Upload creative
      console.log('📝 Step 3: Uploading creative...');
      const uploadResult = await metaAdsCreativeService.uploadCreative(
        formattedAdAccountId.replace('act_', ''), 
        campaignData.criativo, 
        accessToken
      );
      console.log('Creative uploaded:', uploadResult);

      // Validate upload result
      const uploadValidation = MetaAdsValidationUtils.validateCreativeUpload(uploadResult);
      if (!uploadValidation.isValid) {
        throw new Error(uploadValidation.error);
      }

      // Step 4: Create Ad Creative
      console.log('📝 Step 4: Creating ad creative...');
      const creativeId = await AdCreativeCreationService.createAdCreative(
        {
          name: `${campaignName} - Creative`,
          object_story_spec: {
            page_id: pageId,
            link_data: {
              link: campaignData.link_whatsapp,
              message: campaignData.copy || 'Conheça nossos produtos!',
              name: campaignData.copy ? campaignData.copy.substring(0, 100) + '...' : 'Saiba mais',
              description: 'Clique para conversar no WhatsApp',
              call_to_action: {
                type: 'LEARN_MORE',
                value: {
                  link: campaignData.link_whatsapp
                }
              },
              image_hash: uploadResult.hash
            },
            instagram_actor_id: campaignData.selectedInstagram
          }
        },
        formattedAdAccountId,
        accessToken
      );

      // Step 5: Create Ad
      console.log('📝 Step 5: Creating ad...');
      const adId = await adCreationService.createAd(
        formattedAdAccountId,
        campaignName,
        adsetId,
        creativeId,
        accessToken
      );

      console.log('🎉 Campaign creation completed successfully with validated configuration!');
      return {
        campaign_id: campaignId,
        adset_id: adsetId,
        creative_id: creativeId,
        ad_id: adId,
        status: 'success'
      };

    } catch (error) {
      console.error('❌ Error creating campaign:', error);
      return {
        campaign_id: '',
        adset_id: '',
        creative_id: '',
        ad_id: '',
        status: 'error',
        message: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }
}

export const metaAdsCampaignService = new MetaAdsCampaignService();
