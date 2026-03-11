
import { instagramPageConnectionService } from '@/services/metaAds/validation/InstagramPageConnectionService';
import { CampaignData } from '@/types/campaign';

export const useInstagramValidation = () => {
  const validateInstagramConnection = async (
    campaignData: CampaignData,
    accessToken?: string | null
  ): Promise<{ isValid: boolean; shouldProceed: boolean; message?: string; validInstagramId?: string }> => {
    console.log('📱 CORRECTED: Enhanced Instagram validation starting...', {
      hasInstagram: !!campaignData.selectedInstagram,
      instagramId: campaignData.selectedInstagram,
      hasAccessToken: !!accessToken,
      pageId: campaignData.selectedFanPage,
      timestamp: new Date().toISOString()
    });

    // ✅ CORREÇÃO: Permitir campanha sem Instagram (sempre válido)
    if (!campaignData.selectedInstagram || !accessToken) {
      console.log('📱 CORRECTED: No Instagram selected or no token, proceeding without Instagram integration');
      return { 
        isValid: true, 
        shouldProceed: true,
        message: 'Campanha será criada sem Instagram (opcional)'
      };
    }

    try {
      console.log('🔍 CORRECTED: Starting detailed Instagram validation process...');
      
      // ✅ CORREÇÃO: Validação robusta com logs detalhados
      const validation = await instagramPageConnectionService.validateInstagramPageConnection(
        campaignData.selectedFanPage,
        campaignData.selectedInstagram,
        accessToken
      );

      console.log('📊 CORRECTED: Instagram validation detailed result:', {
        connectionType: validation.connectionType,
        isConnected: validation.isConnected,
        instagramId: validation.instagramId,
        pageId: validation.pageId,
        hasConnectionIssues: !validation.isConnected,
        timestamp: new Date().toISOString()
      });

      if (validation.connectionType === 'page_connected') {
        console.log('✅ CORRECTED: Instagram properly connected to page');
        return { 
          isValid: true, 
          shouldProceed: true,
          validInstagramId: validation.instagramId,
          message: "✅ Instagram conectado corretamente à página"
        };
      } else if (validation.connectionType === 'ad_account_only') {
        console.log('⚠️ CORRECTED: Instagram available but not connected to page');
        return {
          isValid: true,
          shouldProceed: true,
          validInstagramId: validation.instagramId,
          message: "⚠️ Instagram disponível mas não conectado à página - campanha pode prosseguir"
        };
      } else {
        console.log('📱 CORRECTED: Instagram validation failed, proceeding without Instagram');
        return {
          isValid: false,
          shouldProceed: true,
          message: "⚠️ Instagram não está conectado corretamente. Campanha será criada sem Instagram."
        };
      }
    } catch (error) {
      console.error('❌ CORRECTED: Error validating Instagram connection:', {
        error: error instanceof Error ? error.message : error,
        instagramId: campaignData.selectedInstagram,
        pageId: campaignData.selectedFanPage,
        timestamp: new Date().toISOString()
      });
      
      // ✅ CORREÇÃO: Sempre permitir prosseguir sem Instagram
      return {
        isValid: false,
        shouldProceed: true,
        message: "⚠️ Erro na validação do Instagram. Campanha será criada sem Instagram."
      };
    }
  };

  return { validateInstagramConnection };
};
