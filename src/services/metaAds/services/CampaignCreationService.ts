
import { META_API_VERSION, normalizeAdAccountId, buildMetaApiUrl, logMetaApiRequest } from '../utils/metaApiConstants';

export class CampaignCreationService {
  private baseUrl = buildMetaApiUrl('');

  async createCampaign(
    adAccountId: string,
    campaignName: string,
    accessToken: string
  ): Promise<string> {
    const actId = normalizeAdAccountId(adAccountId);
    
    // Corpo válido para objetivo de tráfego
    const campaignConfig = {
      name: campaignName,
      objective: 'OUTCOME_TRAFFIC',
      status: 'PAUSED',
      special_ad_categories: [] // manter vazio quando aplicável
    };

    logMetaApiRequest('CAMPAIGN-CREATION-REQUEST', {
      ad_account_normalized: actId,
      body_preview: JSON.stringify(campaignConfig, null, 2)
    });

    const campaignUrl = buildMetaApiUrl(`/${actId}/campaigns?access_token=${accessToken}`);
    const campaignResponse = await fetch(campaignUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignConfig)
    });

    const campaign = await campaignResponse.json();
    
    logMetaApiRequest('CAMPAIGN-CREATION-RESPONSE', {
      ad_account_normalized: actId,
      status: campaignResponse.status,
      campaign_id: campaign.id,
      fbtrace_id: campaignResponse.headers.get('x-fb-trace-id')
    });

    if (!campaignResponse.ok) {
      logMetaApiRequest('CAMPAIGN-CREATION-FAIL', {
        ad_account_normalized: actId,
        error_code: campaign.error?.code,
        error_message: campaign.error?.message,
        fbtrace_id: campaignResponse.headers.get('x-fb-trace-id')
      });
      
      throw new Error(`Erro ao criar campanha: ${campaign.error?.message}`);
    }

    console.log('✅ Campaign created successfully with OUTCOME_TRAFFIC:', campaign.id);
    return campaign.id;
  }
}

export const campaignCreationService = new CampaignCreationService();
