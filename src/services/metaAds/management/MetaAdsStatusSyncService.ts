
import { MetaCampaignStatus, CampaignSyncResult } from '@/types/campaignManagement';
import { metaAdsCampaignManagementService } from './MetaAdsCampaignManagementService';

export class MetaAdsStatusSyncService {
  async syncCampaignStatus(
    localCampaign: any,
    accessToken: string
  ): Promise<CampaignSyncResult> {
    try {
      console.log('🔄 Syncing campaign status:', localCampaign.id);
      
      if (!localCampaign.meta_campaign_id) {
        return {
          success: false,
          localStatus: localCampaign.status,
          metaStatus: 'N/A',
          synced: false,
          error: 'Campaign não possui ID do Meta Ads'
        };
      }

      const metaStatus = await metaAdsCampaignManagementService.getCampaignStatus(
        localCampaign.meta_campaign_id,
        accessToken
      );

      if (!metaStatus) {
        return {
          success: false,
          localStatus: localCampaign.status,
          metaStatus: 'ERROR',
          synced: false,
          error: 'Não foi possível buscar status no Meta Ads'
        };
      }

      const localStatusMapped = this.mapLocalToMetaStatus(localCampaign.status);
      const isSync = localStatusMapped === metaStatus.status;

      console.log('📊 Status comparison:', {
        local: localStatusMapped,
        meta: metaStatus.status,
        synced: isSync
      });

      return {
        success: true,
        localStatus: localStatusMapped,
        metaStatus: metaStatus.status,
        synced: isSync
      };
    } catch (error) {
      console.error('❌ Error syncing campaign status:', error);
      return {
        success: false,
        localStatus: localCampaign.status,
        metaStatus: 'ERROR',
        synced: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    }
  }

  async syncMultipleCampaigns(
    campaigns: any[],
    accessToken: string
  ): Promise<CampaignSyncResult[]> {
    console.log('🔄 Syncing multiple campaigns:', campaigns.length);
    
    const results = await Promise.all(
      campaigns.map(campaign => 
        this.syncCampaignStatus(campaign, accessToken)
      )
    );

    const syncedCount = results.filter(r => r.synced).length;
    console.log(`✅ Sync completed: ${syncedCount}/${campaigns.length} campaigns in sync`);
    
    return results;
  }

  async detectOutOfSyncCampaigns(
    campaigns: any[],
    accessToken: string
  ): Promise<any[]> {
    const syncResults = await this.syncMultipleCampaigns(campaigns, accessToken);
    
    const outOfSyncCampaigns = campaigns.filter((campaign, index) => {
      const syncResult = syncResults[index];
      return syncResult.success && !syncResult.synced;
    });

    console.log('⚠️ Out of sync campaigns found:', outOfSyncCampaigns.length);
    return outOfSyncCampaigns;
  }

  private mapLocalToMetaStatus(localStatus: string): string {
    const statusMap: Record<string, string> = {
      'draft': 'PAUSED',
      'active': 'ACTIVE',
      'paused': 'PAUSED',
      'finished': 'PAUSED',
      'deleted': 'DELETED'
    };

    return statusMap[localStatus] || 'PAUSED';
  }

  private mapMetaToLocalStatus(metaStatus: string): string {
    const statusMap: Record<string, string> = {
      'ACTIVE': 'active',
      'PAUSED': 'paused',
      'DELETED': 'deleted',
      'ARCHIVED': 'finished'
    };

    return statusMap[metaStatus] || 'paused';
  }

  async updateLocalStatusFromMeta(
    campaignId: string,
    metaStatus: MetaCampaignStatus,
    updateFunction: (id: string, status: string) => Promise<void>
  ): Promise<boolean> {
    try {
      const localStatus = this.mapMetaToLocalStatus(metaStatus.status);
      await updateFunction(campaignId, localStatus);
      
      console.log('✅ Local status updated from Meta:', {
        campaignId,
        newStatus: localStatus
      });
      
      return true;
    } catch (error) {
      console.error('❌ Error updating local status:', error);
      return false;
    }
  }
}

export const metaAdsStatusSyncService = new MetaAdsStatusSyncService();
