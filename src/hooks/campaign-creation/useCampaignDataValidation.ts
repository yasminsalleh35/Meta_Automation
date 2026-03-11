
import { CampaignData } from '@/types/campaign';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { instagramPageConnectionService } from '@/services/metaAds/validation/InstagramPageConnectionService';
import { metaAdsAccountService } from '@/services/metaAds/MetaAdsAccountService';

export const useCampaignDataValidation = () => {
  const { existingIntegration } = useMetaAdsIntegration();

  const validateCampaignData = (campaignData: CampaignData): {
    isValid: boolean;
    error?: string;
    field?: string;
  } => {
    console.log('🔍 Validating campaign data...', {
      campaignName: campaignData.campaignName?.trim(),
      selectedFanPage: campaignData.selectedFanPage,
      hasMedia: !!campaignData.media,
      adTitle: campaignData.adTitle?.trim(),
      adText: campaignData.adText?.trim(),
      selectedWhatsApp: campaignData.selectedWhatsApp
    });

    if (!campaignData.campaignName?.trim()) {
      return { isValid: false, error: "Digite um nome para sua campanha.", field: "campaignName" };
    }

    if (!campaignData.selectedFanPage) {
      return { isValid: false, error: "Selecione uma página do Facebook para a campanha.", field: "selectedFanPage" };
    }

    if (!campaignData.media) {
      return { isValid: false, error: "Faça upload de uma imagem ou vídeo.", field: "media" };
    }

    if (!campaignData.adTitle?.trim()) {
      return { isValid: false, error: "Digite um título para o anúncio.", field: "adTitle" };
    }

    if (!campaignData.adText?.trim()) {
      return { isValid: false, error: "Digite o texto do anúncio.", field: "adText" };
    }

    if (!campaignData.selectedWhatsApp) {
      return { isValid: false, error: "Selecione um número do WhatsApp para a campanha.", field: "selectedWhatsApp" };
    }

    console.log('✅ Campaign data validation passed');
    return { isValid: true };
  };

  const autoFixInstagramSelection = async (campaignData: CampaignData): Promise<{
    updatedCampaignData: CampaignData;
    wasFixed: boolean;
    message?: string;
  }> => {
    console.log('🔧 Starting Instagram auto-selection process...');

    // Skip if no integration
    if (!existingIntegration?.access_token) {
      console.log('⚠️ No Meta integration - skipping Instagram auto-selection');
      return {
        updatedCampaignData: campaignData,
        wasFixed: false,
        message: "Meta Ads não conectado. Instagram será configurado automaticamente."
      };
    }

    // Skip if no Facebook page selected
    if (!campaignData.selectedFanPage) {
      console.log('⚠️ No Facebook page selected - skipping Instagram auto-selection');
      return {
        updatedCampaignData: campaignData,
        wasFixed: false
      };
    }

    // If Instagram already selected, validate it
    if (campaignData.selectedInstagram) {
      try {
        console.log('🔍 Validating existing Instagram selection:', campaignData.selectedInstagram);
        
        const validation = await instagramPageConnectionService.validateInstagramPageConnection(
          campaignData.selectedFanPage,
          campaignData.selectedInstagram,
          existingIntegration.access_token
        );

        if (validation.connectionType === 'page_connected') {
          console.log('✅ Current Instagram selection is optimal');
          return {
            updatedCampaignData: campaignData,
            wasFixed: false
          };
        }
        
        console.log('⚠️ Current Instagram selection is not optimal, searching for better option...');
      } catch (error) {
        console.warn('⚠️ Error validating current Instagram selection:', error);
      }
    }

    // Find best Instagram account for the page
    try {
      console.log('🔍 Finding best Instagram account for page:', campaignData.selectedFanPage);
      
      const connectedInstagrams = await metaAdsAccountService.getConnectedInstagramAccounts(
        campaignData.selectedFanPage,
        existingIntegration.access_token
      );

      if (connectedInstagrams.length > 0) {
        const bestInstagram = connectedInstagrams[0];
        console.log('✅ Auto-selected best Instagram:', {
          id: bestInstagram.id,
          name: bestInstagram.name
        });

        return {
          updatedCampaignData: {
            ...campaignData,
            selectedInstagram: bestInstagram.id
          },
          wasFixed: true,
          message: `Instagram "${bestInstagram.name || bestInstagram.id}" foi selecionado automaticamente para melhor compatibilidade.`
        };
      } else {
        console.log('ℹ️ No Instagram accounts connected to page');
        return {
          updatedCampaignData: campaignData,
          wasFixed: false,
          message: "Nenhuma conta do Instagram conectada à página. A campanha será criada apenas no Facebook."
        };
      }
    } catch (error) {
      console.error('❌ Error during Instagram auto-selection:', error);
      return {
        updatedCampaignData: campaignData,
        wasFixed: false,
        message: "Erro ao buscar contas do Instagram. A campanha será criada apenas no Facebook."
      };
    }
  };

  return { 
    validateCampaignData,
    autoFixInstagramSelection
  };
};
