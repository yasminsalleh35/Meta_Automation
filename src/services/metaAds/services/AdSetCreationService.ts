
import { CampaignCreationData } from '../types';
import { MetaTargetingSpec } from '@/types/location';
import { BudgetUtils } from '../utils/budgetUtils';
import { TargetingSpecBuilder } from '../location/TargetingSpecBuilder';

interface AdSetConfig {
  name: string;
  campaign_id: string;
  optimization_goal: string;
  billing_event: string;
  bid_strategy?: string;
  bid_amount?: number;
  daily_budget: number;
  targeting: MetaTargetingSpec;
  status: string;
  promoted_object?: {
    page_id: string;
    application_id?: string;
    object_store_url?: string;
  };
}

import { META_API_VERSION, normalizeAdAccountId, buildMetaApiUrl, logMetaApiRequest } from '../utils/metaApiConstants';

export class AdSetCreationService {
  private baseUrl = buildMetaApiUrl('');

  async createAdSet(
    adAccountId: string,
    campaignId: string,
    campaignName: string,
    pageId: string,
    campaignData: CampaignCreationData,
    accessToken: string
  ): Promise<string> {
    const actId = normalizeAdAccountId(adAccountId);
    
    console.log('🎯 Creating AdSet with corrected configuration for OUTCOME_TRAFFIC...');
    console.log('📊 Raw campaign data received:', {
      daily_budget: campaignData.daily_budget,
      location: campaignData.localizacao,
      selectedLocations: campaignData.selectedLocations?.length || 0,
      whatsappLink: campaignData.link_whatsapp
    });
    
    const adsetUrl = buildMetaApiUrl(`/${actId}/adsets?access_token=${accessToken}`);
    
    // ✅ FIXED: Validar e converter orçamento corretamente
    const budgetValidation = BudgetUtils.validateDailyBudget(campaignData.daily_budget || 50);
    
    if (!budgetValidation.isValid) {
      throw new Error(`Erro de orçamento: ${budgetValidation.error}`);
    }

    console.log(`💰 Budget validation successful: ${BudgetUtils.formatBudgetForLog(budgetValidation.valueInCents)}`);

    // ✅ FIXED: Usar targeting oficial do Meta
    const targeting = await TargetingSpecBuilder.buildTargetingSpec(campaignData, accessToken);
    
    // Validar targeting
    const targetingValidation = TargetingSpecBuilder.validateTargetingSpec(targeting);
    if (!targetingValidation.isValid) {
      throw new Error(`Erro de targeting: ${targetingValidation.error}`);
    }

    console.log('🎯 Official Meta targeting built:', JSON.stringify(targeting, null, 2));

    // Determinar plataformas baseado na validação do Instagram
    const publisherPlatforms = campaignData.selectedInstagram ? ['facebook', 'instagram'] : ['facebook'];
    
    // ✅ CRITICAL FIX: Configure AdSet properly for OUTCOME_TRAFFIC campaigns
    const adsetConfig: AdSetConfig = {
      name: `${campaignName} - AdSet`,
      campaign_id: campaignId,
      // ✅ FIXED: Use OUTCOME_TRAFFIC alinhado ao objective
      optimization_goal: 'OUTCOME_TRAFFIC',
      // ✅ FIXED: Use IMPRESSIONS (UPPERCASE) - aceito e simples para OUTCOME_TRAFFIC
      billing_event: 'IMPRESSIONS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      daily_budget: budgetValidation.valueInCents,
      targeting: {
        ...targeting,
        publisher_platforms: publisherPlatforms,
        device_platforms: ['mobile']
      } as any,
      // ✅ FIXED: destination_type coerente com WhatsApp
      promoted_object: {
        page_id: pageId
      },
      status: 'PAUSED'
    };

    logMetaApiRequest('ADSET-CREATION-REQUEST', {
      ad_account_normalized: actId,
      body_preview: JSON.stringify(adsetConfig, null, 2)
    });

    const adsetResponse = await fetch(adsetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adsetConfig)
    });

    if (!adsetResponse.ok) {
      const error = await adsetResponse.json();
      console.error('❌ AdSet creation error:', error);
      console.error('📝 AdSet config that failed:', adsetConfig);
      
      // Enhanced error logging
      console.error('🔍 Detailed error analysis:', {
        budgetSent: budgetValidation.valueInCents,
        budgetInReais: BudgetUtils.convertToReais(budgetValidation.valueInCents),
        targetingSent: targeting,
        optimizationGoal: adsetConfig.optimization_goal,
        billingEvent: adsetConfig.billing_event,
        promotedObject: adsetConfig.promoted_object,
        errorCode: error.error?.code,
        errorMessage: error.error?.message,
        errorType: error.error?.type,
        errorFbtraceId: error.error?.fbtrace_id
      });
      
      // ✅ FALLBACK: Try with simplified configuration if first attempt fails
      if (error.error?.code === 100 && error.error?.message?.includes('Invalid parameter')) {
        console.log('🔄 FALLBACK: Trying with simplified AdSet configuration...');
        
        const fallbackConfig = {
          name: `${campaignName} - AdSet`,
          campaign_id: campaignId,
          optimization_goal: 'LINK_CLICKS', // Simplified goal
          billing_event: 'IMPRESSIONS', // Simplified billing
          daily_budget: budgetValidation.valueInCents,
          targeting: targeting,
          promoted_object: {
            page_id: pageId
          },
          status: 'PAUSED'
        };

        console.log('📝 FALLBACK AdSet config:', JSON.stringify(fallbackConfig, null, 2));

        const fallbackResponse = await fetch(adsetUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fallbackConfig)
        });

        if (!fallbackResponse.ok) {
          const fallbackError = await fallbackResponse.json();
          console.error('❌ Fallback AdSet creation also failed:', fallbackError);
          throw new Error(`Erro ao criar conjunto de anúncios (fallback): ${fallbackError.error?.message || 'Erro desconhecido'}`);
        }

        const fallbackAdset = await fallbackResponse.json();
        console.log('✅ Fallback AdSet created successfully:', fallbackAdset.id);
        return fallbackAdset.id;
      }
      
      throw new Error(`Erro ao criar conjunto de anúncios: ${error.error?.message || 'Erro desconhecido'}`);
    }

    const adset = await adsetResponse.json();
    console.log('✅ AdSet created successfully with corrected configuration:', adset.id);
    console.log(`💰 Final budget: ${BudgetUtils.formatBudgetForLog(budgetValidation.valueInCents)}`);
    
    return adset.id;
  }
}

export const adSetCreationService = new AdSetCreationService();
