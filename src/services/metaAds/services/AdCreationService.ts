

import { AdConfig } from '../types';

import { META_API_VERSION, normalizeAdAccountId, buildMetaApiUrl, logMetaApiRequest } from '../utils/metaApiConstants';

export class AdCreationService {
  private baseUrl = buildMetaApiUrl('');

  async createAd(
    adAccountId: string,
    campaignName: string,
    adsetId: string,
    creativeId: string,
    accessToken: string
  ): Promise<string> {
    const actId = normalizeAdAccountId(adAccountId);
    
    console.log('Creating ad for OUTCOME_TRAFFIC campaign...');
    const adUrl = buildMetaApiUrl(`/${actId}/ads?access_token=${accessToken}`);
    
    // FIXED: Simplified creative configuration for OUTCOME_TRAFFIC objective
    const adConfig: AdConfig = {
      name: `${campaignName} - Ad`,
      adset_id: adsetId,
      creative: { 
        creative_id: creativeId 
      },
      status: 'PAUSED'
    };

    logMetaApiRequest('AD-CREATION-REQUEST', {
      ad_account_normalized: actId,
      body_preview: JSON.stringify(adConfig, null, 2)
    });

    const adResponse = await fetch(adUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adConfig)
    });

    const ad = await adResponse.json();
    
    logMetaApiRequest('AD-CREATION-RESPONSE', {
      ad_account_normalized: actId,
      status: adResponse.status,
      ad_id: ad.id,
      fbtrace_id: adResponse.headers.get('x-fb-trace-id')
    });

    if (!adResponse.ok) {
      logMetaApiRequest('AD-CREATION-FAIL', {
        ad_account_normalized: actId,
        error_code: ad.error?.code,
        error_message: ad.error?.message,
        fbtrace_id: adResponse.headers.get('x-fb-trace-id')
      });
      
      throw new Error(`Erro ao criar anúncio: ${ad.error?.message || 'Parâmetro inválido'}`);
    }

    console.log('Ad created successfully:', ad.id);
    
    return ad.id;
  }
}

export const adCreationService = new AdCreationService();

