import { MetaCampaignStatus, CampaignManagementResponse } from '@/types/campaignManagement';

export class MetaAdsCampaignManagementService {
  private baseUrl = 'https://graph.facebook.com/v23.0';

  async pauseCampaign(campaignId: string, accessToken: string): Promise<CampaignManagementResponse> {
    try {
      console.log('🔄 Pausing Meta campaign:', campaignId);
      
      const response = await fetch(`${this.baseUrl}/${campaignId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAUSED',
          access_token: accessToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ Campaign paused successfully:', result);

      return {
        success: true,
        campaignId,
        newStatus: 'PAUSED',
        message: 'Campanha pausada com sucesso no Meta Ads'
      };
    } catch (error) {
      console.error('❌ Error pausing campaign:', error);
      return {
        success: false,
        campaignId,
        newStatus: 'PAUSED',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async activateCampaign(campaignId: string, accessToken: string): Promise<CampaignManagementResponse> {
    try {
      console.log('🚀 Activating Meta campaign:', campaignId);
      
      const response = await fetch(`${this.baseUrl}/${campaignId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACTIVE',
          access_token: accessToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ Campaign activated successfully:', result);

      return {
        success: true,
        campaignId,
        newStatus: 'ACTIVE',
        message: 'Campanha ativada com sucesso no Meta Ads'
      };
    } catch (error) {
      console.error('❌ Error activating campaign:', error);
      return {
        success: false,
        campaignId,
        newStatus: 'ACTIVE',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async activateAdSet(adsetId: string, accessToken: string): Promise<CampaignManagementResponse> {
    try {
      console.log('🚀 Activating Meta adset:', adsetId);
      
      const response = await fetch(`${this.baseUrl}/${adsetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACTIVE',
          access_token: accessToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ AdSet activated successfully:', result);

      return {
        success: true,
        campaignId: adsetId,
        newStatus: 'ACTIVE',
        message: 'Conjunto de anúncios ativado com sucesso'
      };
    } catch (error) {
      console.error('❌ Error activating adset:', error);
      return {
        success: false,
        campaignId: adsetId,
        newStatus: 'ACTIVE',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async pauseAdSet(adsetId: string, accessToken: string): Promise<CampaignManagementResponse> {
    try {
      console.log('🔄 Pausing Meta adset:', adsetId);
      
      const response = await fetch(`${this.baseUrl}/${adsetId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAUSED',
          access_token: accessToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ AdSet paused successfully:', result);

      return {
        success: true,
        campaignId: adsetId,
        newStatus: 'PAUSED',
        message: 'Conjunto de anúncios pausado com sucesso'
      };
    } catch (error) {
      console.error('❌ Error pausing adset:', error);
      return {
        success: false,
        campaignId: adsetId,
        newStatus: 'PAUSED',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async activateAd(adId: string, accessToken: string): Promise<CampaignManagementResponse> {
    try {
      console.log('🚀 Activating Meta ad:', adId);
      
      const response = await fetch(`${this.baseUrl}/${adId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'ACTIVE',
          access_token: accessToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ Ad activated successfully:', result);

      return {
        success: true,
        campaignId: adId,
        newStatus: 'ACTIVE',
        message: 'Anúncio ativado com sucesso'
      };
    } catch (error) {
      console.error('❌ Error activating ad:', error);
      return {
        success: false,
        campaignId: adId,
        newStatus: 'ACTIVE',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async pauseAd(adId: string, accessToken: string): Promise<CampaignManagementResponse> {
    try {
      console.log('🔄 Pausing Meta ad:', adId);
      
      const response = await fetch(`${this.baseUrl}/${adId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'PAUSED',
          access_token: accessToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ Ad paused successfully:', result);

      return {
        success: true,
        campaignId: adId,
        newStatus: 'PAUSED',
        message: 'Anúncio pausado com sucesso'
      };
    } catch (error) {
      console.error('❌ Error pausing ad:', error);
      return {
        success: false,
        campaignId: adId,
        newStatus: 'PAUSED',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async activateCampaignCascade(
    campaignId: string,
    adsetId: string,
    adId: string,
    accessToken: string
  ): Promise<CampaignManagementResponse> {
    try {
      console.log('🚀 Starting cascade activation for:', { campaignId, adsetId, adId });

      // 1. Ativar campanha
      console.log('🔄 Step 1: Activating campaign...');
      const campaignResult = await this.activateCampaign(campaignId, accessToken);
      if (!campaignResult.success) {
        throw new Error(`Erro ao ativar campanha: ${campaignResult.error}`);
      }

      // 2. Ativar adset
      console.log('🔄 Step 2: Activating adset...');
      const adsetResult = await this.activateAdSet(adsetId, accessToken);
      if (!adsetResult.success) {
        // Rollback: pausar campanha
        console.log('⚠️ AdSet activation failed, rolling back campaign...');
        await this.pauseCampaign(campaignId, accessToken);
        throw new Error(`Erro ao ativar conjunto de anúncios: ${adsetResult.error}`);
      }

      // 3. Ativar ad
      console.log('🔄 Step 3: Activating ad...');
      const adResult = await this.activateAd(adId, accessToken);
      if (!adResult.success) {
        // Rollback: pausar adset e campanha
        console.log('⚠️ Ad activation failed, rolling back adset and campaign...');
        await this.pauseAdSet(adsetId, accessToken);
        await this.pauseCampaign(campaignId, accessToken);
        throw new Error(`Erro ao ativar anúncio: ${adResult.error}`);
      }

      console.log('✅ Cascade activation completed successfully!');
      return {
        success: true,
        campaignId,
        newStatus: 'ACTIVE',
        message: 'Campanha, conjunto e anúncio ativados com sucesso!'
      };

    } catch (error) {
      console.error('❌ Error in cascade activation:', error);
      return {
        success: false,
        campaignId,
        newStatus: 'ACTIVE',
        error: error instanceof Error ? error.message : 'Erro na ativação em cascata'
      };
    }
  }

  async deleteCampaign(campaignId: string, accessToken: string): Promise<CampaignManagementResponse> {
    try {
      console.log('🗑️ Deleting Meta campaign:', campaignId);
      
      const response = await fetch(`${this.baseUrl}/${campaignId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          access_token: accessToken
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Meta API Error: ${error.error?.message || 'Unknown error'}`);
      }

      const result = await response.json();
      console.log('✅ Campaign deleted successfully:', result);

      return {
        success: true,
        campaignId,
        newStatus: 'DELETED',
        message: 'Campanha excluída com sucesso no Meta Ads'
      };
    } catch (error) {
      console.error('❌ Error deleting campaign:', error);
      return {
        success: false,
        campaignId,
        newStatus: 'DELETED',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async getCampaignStatus(campaignId: string, accessToken: string): Promise<MetaCampaignStatus | null> {
    try {
      console.log('📊 Fetching Meta campaign status:', campaignId);
      
      const response = await fetch(
        `${this.baseUrl}/${campaignId}?fields=id,name,status,effective_status,configured_status,objective,created_time,updated_time,start_time,stop_time,daily_budget,lifetime_budget&access_token=${accessToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Error fetching campaign status:', error);
        return null;
      }

      const campaign = await response.json();
      console.log('✅ Campaign status fetched:', campaign);

      return {
        id: campaign.id,
        status: campaign.status,
        effective_status: campaign.effective_status,
        configured_status: campaign.configured_status,
        name: campaign.name,
        objective: campaign.objective,
        created_time: campaign.created_time,
        updated_time: campaign.updated_time,
        start_time: campaign.start_time,
        stop_time: campaign.stop_time,
        daily_budget: campaign.daily_budget,
        lifetime_budget: campaign.lifetime_budget
      };
    } catch (error) {
      console.error('❌ Error fetching campaign status:', error);
      return null;
    }
  }

  async bulkUpdateCampaigns(
    campaignIds: string[],
    status: 'ACTIVE' | 'PAUSED',
    accessToken: string
  ): Promise<CampaignManagementResponse[]> {
    console.log('🔄 Bulk updating campaigns:', { campaignIds, status });
    
    const results = await Promise.all(
      campaignIds.map(async (campaignId) => {
        if (status === 'PAUSED') {
          return this.pauseCampaign(campaignId, accessToken);
        } else {
          return this.activateCampaign(campaignId, accessToken);
        }
      })
    );

    console.log('✅ Bulk update completed:', results);
    return results;
  }
}

export const metaAdsCampaignManagementService = new MetaAdsCampaignManagementService();
