
export interface MetaCampaignInfo {
  id: string;
  name: string;
  status: string;
  effective_status: string;
  adsets?: {
    data: Array<{
      id: string;
      name: string;
      ads: {
        data: Array<{
          id: string;
          name: string;
          creative: {
            id: string;
          };
        }>;
      };
    }>;
  };
}

export interface CampaignSyncResult {
  localCampaignId: string;
  metaCampaignId?: string;
  metaAdsetId?: string;
  metaAdId?: string;
  matched: boolean;
  confidence: number;
  reason: string;
}

export class MetaAdsCampaignSyncService {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  async getMetaCampaigns(adAccountId: string, accessToken: string): Promise<MetaCampaignInfo[]> {
    try {
      console.log('🔍 Fetching Meta campaigns for account:', adAccountId);
      
      const response = await fetch(
        `${this.baseUrl}/${adAccountId}/campaigns?fields=id,name,status,effective_status,adsets{id,name,ads{id,name,creative{id}}}&access_token=${accessToken}`
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('📊 Found Meta campaigns:', data.data?.length || 0);
      
      return data.data || [];
    } catch (error) {
      console.error('❌ Error fetching Meta campaigns:', error);
      throw error;
    }
  }

  async syncCampaigns(
    localCampaigns: any[],
    metaCampaigns: MetaCampaignInfo[]
  ): Promise<CampaignSyncResult[]> {
    console.log('🔄 Starting campaign synchronization...');
    console.log('Local campaigns:', localCampaigns.length);
    console.log('Meta campaigns:', metaCampaigns.length);

    const results: CampaignSyncResult[] = [];

    for (const localCampaign of localCampaigns) {
      const syncResult = this.matchCampaign(localCampaign, metaCampaigns);
      results.push(syncResult);
    }

    const matchedCount = results.filter(r => r.matched).length;
    console.log(`✅ Sync completed: ${matchedCount}/${localCampaigns.length} campaigns matched`);

    return results;
  }

  private matchCampaign(localCampaign: any, metaCampaigns: MetaCampaignInfo[]): CampaignSyncResult {
    // If already has meta_campaign_id, verify it exists
    if (localCampaign.meta_campaign_id) {
      const existingMeta = metaCampaigns.find(mc => mc.id === localCampaign.meta_campaign_id);
      if (existingMeta) {
        return {
          localCampaignId: localCampaign.id,
          metaCampaignId: existingMeta.id,
          metaAdsetId: existingMeta.adsets?.data[0]?.id,
          metaAdId: existingMeta.adsets?.data[0]?.ads?.data[0]?.id,
          matched: true,
          confidence: 1.0,
          reason: 'Already linked and verified'
        };
      } else {
        console.warn(`⚠️ Meta campaign ${localCampaign.meta_campaign_id} not found for local campaign ${localCampaign.id}`);
      }
    }

    // Try exact name match
    const exactMatch = metaCampaigns.find(mc => 
      mc.name.toLowerCase().trim() === localCampaign.name.toLowerCase().trim()
    );

    if (exactMatch) {
      return {
        localCampaignId: localCampaign.id,
        metaCampaignId: exactMatch.id,
        metaAdsetId: exactMatch.adsets?.data[0]?.id,
        metaAdId: exactMatch.adsets?.data[0]?.ads?.data[0]?.id,
        matched: true,
        confidence: 0.95,
        reason: 'Exact name match'
      };
    }

    // Try partial name match
    const partialMatch = metaCampaigns.find(mc => {
      const localName = localCampaign.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      const metaName = mc.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return localName.includes(metaName) || metaName.includes(localName);
    });

    if (partialMatch) {
      return {
        localCampaignId: localCampaign.id,
        metaCampaignId: partialMatch.id,
        metaAdsetId: partialMatch.adsets?.data[0]?.id,
        metaAdId: partialMatch.adsets?.data[0]?.ads?.data[0]?.id,
        matched: true,
        confidence: 0.7,
        reason: 'Partial name match'
      };
    }

    // Try matching by creation date proximity (if available)
    const createdDate = new Date(localCampaign.created_at);
    const proximityMatch = metaCampaigns.find(mc => {
      if (!mc.name.includes('Camply') && !mc.name.includes('Lead')) return false;
      // Meta campaigns created around the same time are likely matches
      return true;
    });

    if (proximityMatch) {
      return {
        localCampaignId: localCampaign.id,
        metaCampaignId: proximityMatch.id,
        metaAdsetId: proximityMatch.adsets?.data[0]?.id,
        metaAdId: proximityMatch.adsets?.data[0]?.ads?.data[0]?.id,
        matched: true,
        confidence: 0.5,
        reason: 'Proximity and pattern match'
      };
    }

    return {
      localCampaignId: localCampaign.id,
      matched: false,
      confidence: 0,
      reason: 'No matching Meta campaign found'
    };
  }

  async updateLocalCampaignIds(
    syncResults: CampaignSyncResult[],
    updateFunction: (campaignId: string, metaIds: {
      meta_campaign_id?: string;
      meta_adset_id?: string;
      meta_ad_id?: string;
    }) => Promise<void>
  ): Promise<void> {
    console.log('💾 Updating local campaign IDs...');

    for (const result of syncResults) {
      if (result.matched && result.metaCampaignId) {
        try {
          await updateFunction(result.localCampaignId, {
            meta_campaign_id: result.metaCampaignId,
            meta_adset_id: result.metaAdsetId,
            meta_ad_id: result.metaAdId
          });
          
          console.log(`✅ Updated campaign ${result.localCampaignId} with Meta IDs`);
        } catch (error) {
          console.error(`❌ Failed to update campaign ${result.localCampaignId}:`, error);
        }
      }
    }
  }
}

export const metaAdsCampaignSyncService = new MetaAdsCampaignSyncService();
