import { useCallback } from 'react';
import { useAdSetVerification } from '@/hooks/useAdSetVerification';
import { CampaignData } from '@/types/campaign';

export const useAdSetVerificationIntegration = () => {
  const { saveExpectedSettings, updateAdSetId, verifyAndCorrectAdSet } = useAdSetVerification();

  const prepareExpectedSettings = useCallback((
    campaignData: CampaignData,
    metaCampaignId: string,
    adAccountId: string
  ) => {
    console.log('🎯 Preparing expected Ad Set settings from campaign data');

    // Preparar configurações de localidade usando a nova estrutura
    const expectedLocalityJson = prepareLocalityData(campaignData);

    // Determinar tipo e valor do orçamento
    const budgetType = campaignData.budget.total ? 'lifetime_budget' : 'daily_budget';
    const budgetAmount = campaignData.budget.total || campaignData.budget.daily || 50;

    // Converter orçamento para centavos (assumindo USD/BRL)
    const budgetInCents = Math.round(budgetAmount * 100);

    const expectedSettings = {
      ad_account_id: adAccountId,
      campaign_id: metaCampaignId,
      expected_name: `${campaignData.campaignName} - Ad Set`,
      expected_locality_json: expectedLocalityJson,
      expected_budget_amount: budgetInCents,
      expected_budget_type: budgetType as 'daily_budget' | 'lifetime_budget',
      expected_instagram_profile_id: campaignData.instagramAccount || undefined
    };

    console.log('📋 Expected settings prepared:', expectedSettings);
    return expectedSettings;
  }, []);

  const prepareLocalityData = (campaignData: CampaignData) => {
    // Converter dados de localização do campaign para formato Meta API
    const locationData = campaignData.location;

    if (locationData.selectedLocations && locationData.selectedLocations.length > 0) {
      // Usar localizações selecionadas do novo sistema
      const geoLocations: any = {
        location_types: ['home', 'recent']
      };

      // Separar por tipo conforme estrutura Meta API
      const countries: string[] = [];
      const regions: Array<{ key: string }> = [];
      const cities: Array<{ key: string; radius?: number; distance_unit?: string }> = [];

      locationData.selectedLocations.forEach(location => {
        switch (location.type) {
          case 'country':
            if (location.country_code) {
              countries.push(location.country_code);
            }
            break;
          case 'region':
            regions.push({ key: location.key });
            break;
          case 'city':
            const cityObj: any = { key: location.key };
            if (location.radius && location.radius > 0) {
              cityObj.radius = location.radius;
              cityObj.distance_unit = location.distance_unit || 'kilometer';
            }
            cities.push(cityObj);
            break;
        }
      });

      // Montar objeto final
      if (countries.length > 0) {
        geoLocations.countries = countries;
      }
      if (regions.length > 0) {
        geoLocations.regions = regions;
      }
      if (cities.length > 0) {
        geoLocations.cities = cities;
      }

      // Garantir que pelo menos Brasil esteja especificado se não há países
      if (!geoLocations.countries && !geoLocations.regions && !geoLocations.cities) {
        geoLocations.countries = ['BR'];
      }

      return geoLocations;
    } else {
      // Fallback para Brasil se não houver localizações
      return {
        countries: ['BR'],
        location_types: ['home', 'recent']
      };
    }
  };

  const integrateWithCampaignCreation = useCallback(async (
    campaignData: CampaignData,
    metaCampaignId: string,
    adAccountId: string,
    onAdSetCreated?: (adSetId: string) => void
  ) => {
    console.log('🔗 Integrating Ad Set verification with campaign creation');

    try {
      // 1. Salvar configurações esperadas
      const expectedSettings = prepareExpectedSettings(campaignData, metaCampaignId, adAccountId);
      const savedSettings = await saveExpectedSettings(expectedSettings);

      console.log('💾 Expected settings saved with ID:', savedSettings.id);

      // 2. Retornar função para ser chamada após criação do Ad Set
      return {
        settingsId: savedSettings.id,
        onAdSetCreated: async (adSetId: string) => {
          console.log(`🔄 Ad Set created, updating settings: ${adSetId}`);
          
          // Atualizar ID do Ad Set
          await updateAdSetId(savedSettings.id, adSetId);
          
          // ✨ NOVO: Agendar verificação automática após delay
          setTimeout(async () => {
            console.log('🔍 Starting automatic verification...');
            try {
              await verifyAndCorrectAdSet(adSetId, adAccountId);
              console.log('✅ Automatic verification completed successfully');
            } catch (error) {
              console.warn('⚠️ Automatic verification failed, will retry later:', error);
              // A verificação será tentada novamente pelo cron job
            }
          }, 10000); // 10 segundos de delay para garantir que o Ad Set esteja pronto

          // Chamar callback opcional
          if (onAdSetCreated) {
            onAdSetCreated(adSetId);
          }
        }
      };
    } catch (error) {
      console.error('Failed to integrate verification:', error);
      throw error;
    }
  }, [prepareExpectedSettings, saveExpectedSettings, updateAdSetId, verifyAndCorrectAdSet]);

  // ✨ NOVO: Função para agendar verificação automática
  const scheduleAutomaticVerification = useCallback(async (adSetId: string, adAccountId: string) => {
    console.log(`📅 Scheduling automatic verification for Ad Set: ${adSetId}`);
    
    try {
      // Executar verificação após delay para garantir que o Ad Set esteja ativo
      setTimeout(async () => {
        console.log(`🔍 Running scheduled verification for: ${adSetId}`);
        try {
          await verifyAndCorrectAdSet(adSetId, adAccountId);
          console.log(`✅ Scheduled verification completed for: ${adSetId}`);
        } catch (error) {
          console.warn(`⚠️ Scheduled verification failed for ${adSetId}:`, error);
        }
      }, 30000); // 30 segundos para garantir que tudo esteja configurado
      
    } catch (error) {
      console.error('Error scheduling automatic verification:', error);
    }
  }, [verifyAndCorrectAdSet]);

  return {
    prepareExpectedSettings,
    integrateWithCampaignCreation,
    scheduleAutomaticVerification
  };
};
