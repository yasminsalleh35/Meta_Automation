
import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { CampaignData } from '@/types/campaign';
import { useMetaAds } from '@/hooks/useMetaAds';
import { useCampaignSaver } from '@/hooks/campaign/useCampaignSaver';
import { useAdSetVerificationIntegration } from './useAdSetVerificationIntegration';
import { useCampaignLocationData } from '@/hooks/useCampaignLocationData';
import { useInstagramValidation } from './useInstagramValidation';
import { CampaignCreationData, LocationData } from '@/services/metaAds/types';

export const useMetaCampaignCreationLogic = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const { connection, createCampaign: createMetaCampaign } = useMetaAds();
  const { saveCampaign: saveCampaignToDb } = useCampaignSaver();
  const { integrateWithCampaignCreation } = useAdSetVerificationIntegration();
  const { prepareLocationData } = useCampaignLocationData();
  const { validateInstagramConnection } = useInstagramValidation();

  const handleCreateMetaCampaign = useCallback(async (
    campaignData: CampaignData,
    saveCampaign: () => Promise<string | null>,
    updateCampaignData?: (field: string, value: any) => void
  ) => {
    console.log('🚀 CORRECTED: Enhanced Meta campaign creation with preserved data validation...');
    
    // ✅ CORREÇÃO: Logs detalhados do estado inicial
    console.log('📋 CORRECTED: Initial campaign data analysis:', {
      hasLocation: !!campaignData?.location,
      selectedLocationsCount: campaignData.location?.selectedLocations?.length || 0,
      selectedAddress: campaignData.location?.selectedAddress,
      locationData: campaignData.location?.selectedLocations?.map(loc => ({
        name: loc.name,
        key: loc.key,
        type: loc.type
      })) || [],
      hasInstagram: !!campaignData.selectedInstagram,
      instagramId: campaignData.selectedInstagram,
      timestamp: new Date().toISOString()
    });
    
    // ✅ CORREÇÃO: Validação crítica aprimorada
    if (!campaignData?.location?.selectedLocations || campaignData.location.selectedLocations.length === 0) {
      console.error('❌ CRITICAL: No location data found in campaign');
      toast({
        title: "Erro de localização",
        description: "Dados de localização não encontrados. Volte ao passo de localização e selecione uma cidade.",
        variant: "destructive"
      });
      return false;
    }

    setIsMetaLoading(true);

    try {
      // Step 1: Validate Meta integration
      if (!connection.isConnected || !connection.adAccountId || !connection.pageId) {
        throw new Error('Meta Ads integration not properly configured');
      }

      // Step 2: ✅ CORREÇÃO: Preparação robusta com preservação de cidade
      console.log('📊 CORRECTED: Preparing location data with city preservation...');
      
      const locationData = prepareLocationData(campaignData);
      
      console.log('🏙️ CORRECTED: Location data preparation result:', {
        localizacao: locationData.localizacao,
        selectedLocationsCount: locationData.selectedLocations.length,
        locationNames: locationData.selectedLocations.map(loc => loc.name),
        locationTypes: locationData.selectedLocations.map(loc => loc.type),
        hasSpecificCity: locationData.selectedLocations.some(loc => loc.type === 'city'),
        coordinates: locationData.coordinates
      });
      
      // ✅ VALIDAÇÃO FINAL aprimorada
      if (!locationData.selectedLocations || locationData.selectedLocations.length === 0) {
        throw new Error('Preparação de dados de localização falhou após todas as tentativas.');
      }

      // Step 3: ✅ CORREÇÃO: Validação robusta do Instagram
      console.log('📱 CORRECTED: Starting enhanced Instagram validation...');
      const instagramValidation = await validateInstagramConnection(campaignData, connection.accessToken);
      
      console.log('📱 CORRECTED: Instagram validation result:', {
        isValid: instagramValidation.isValid,
        shouldProceed: instagramValidation.shouldProceed,
        validInstagramId: instagramValidation.validInstagramId,
        message: instagramValidation.message
      });

      // Convert to Meta Ads format
      const metaSelectedLocations: LocationData[] = locationData.selectedLocations.map(loc => ({
        key: loc.key,
        name: loc.name,
        type: loc.type,
        country_code: loc.country_code,
        region: loc.region,
        radius: loc.radius,
        distance_unit: loc.distance_unit as "kilometer" | "mile" | undefined,
        coordinates: loc.coordinates
      }));

      // Step 4: Prepare Meta campaign data with corrected Instagram
      const metaCampaignData: CampaignCreationData = {
        localizacao: locationData.localizacao,
        criativo: campaignData.media!,
        copy: campaignData.adText,
        link_whatsapp: `https://wa.me/${campaignData.selectedWhatsApp?.replace(/\D/g, '')}`,
        daily_budget: campaignData.budget.daily,
        selectedInstagram: instagramValidation.validInstagramId || undefined, // ✅ CORREÇÃO: Usar ID validado
        selectedLocations: metaSelectedLocations,
        coordinates: locationData.coordinates
      };

      console.log('🎯 CORRECTED: Final Meta campaign data with enhanced validation:', {
        localizacao: metaCampaignData.localizacao,
        selectedLocationsCount: metaCampaignData.selectedLocations?.length || 0,
        locationNames: metaCampaignData.selectedLocations?.map(loc => loc.name) || [],
        locationTypes: metaCampaignData.selectedLocations?.map(loc => loc.type) || [],
        budget: metaCampaignData.daily_budget,
        hasValidInstagram: !!metaCampaignData.selectedInstagram,
        validatedInstagramId: metaCampaignData.selectedInstagram,
        timestamp: new Date().toISOString()
      });

      // Step 5: ✅ ÚNICO PONTO DE CRIAÇÃO: Create Meta campaign
      console.log('🎯 CORRECTED: Creating Meta campaign with preserved location and validated Instagram...');
      const metaResult = await createMetaCampaign(metaCampaignData);

      if (!metaResult) {
        throw new Error('Meta campaign creation failed: No response');
      }

      // ✅ Se houver contingency_mode, tratar como sucesso
      if (metaResult.contingency_mode) {
        console.log('✅ Campanha em modo contingência - Tratando como sucesso');
        toast({
          title: "Campanha em processamento",
          description: metaResult.message || "Sua campanha será finalizada em breve pela nossa equipe!",
          duration: 5000
        });
        
        // Retornar sucesso para continuar o fluxo
        return true;
      }

      if (metaResult.status !== 'success') {
        throw new Error(`Meta campaign creation failed: ${metaResult?.message || 'Unknown error'}`);
      }

      console.log('✅ CORRECTED: Meta campaign created successfully with enhanced data:', {
        campaign_id: metaResult.campaign_id,
        adset_id: metaResult.adset_id,
        ad_id: metaResult.ad_id,
        finalLocation: metaCampaignData.localizacao,
        finalInstagram: metaCampaignData.selectedInstagram || 'None (campaign without Instagram)'
      });

      // Step 6: Update campaign data with Meta IDs
      const enrichedCampaignData = {
        ...campaignData,
        meta_campaign_id: metaResult.campaign_id,
        meta_adset_id: metaResult.adset_id,
        meta_ad_id: metaResult.ad_id,
        processing_status: 'completed'
      };

      // Step 7: Save to database
      console.log('💾 CORRECTED: Saving enhanced campaign to database...');
      const campaignId = await saveCampaignToDb(enrichedCampaignData);
      
      if (!campaignId) {
        throw new Error('Failed to save campaign to database');
      }

      // Step 8: Update local state if callback provided
      if (updateCampaignData) {
        updateCampaignData('campaignId', campaignId);
        updateCampaignData('meta_campaign_id', metaResult.campaign_id);
        updateCampaignData('meta_adset_id', metaResult.adset_id);
        updateCampaignData('meta_ad_id', metaResult.ad_id);
        updateCampaignData('processing_status', 'completed');
      }

      // Success - just return true, let the calling component handle navigation and toast
      console.log('✅ Campaign created successfully:', {
        instagramConnected: instagramValidation.isValid,
        location: locationData.localizacao
      });

      return true;

    } catch (error) {
      console.error('❌ CORRECTED: Meta campaign creation failed with enhanced logging:', {
        error: error instanceof Error ? error.message : error,
        campaignData: {
          hasLocation: !!campaignData.location,
          locationCount: campaignData.location?.selectedLocations?.length || 0,
          hasInstagram: !!campaignData.selectedInstagram
        },
        timestamp: new Date().toISOString()
      });
      
      let errorMessage = 'Ocorreu um erro durante a criação da campanha';
      if (error instanceof Error) {
        if (error.message.includes('localização') || error.message.includes('location')) {
          errorMessage = 'Erro nos dados de localização. Volte ao passo de localização e selecione uma cidade novamente.';
        } else if (error.message.includes('Meta')) {
          errorMessage = 'Erro na integração com Meta Ads. Verifique sua conexão e tente novamente.';
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Erro na criação da campanha",
        description: errorMessage,
        variant: "destructive"
      });

      // Update status to error
      if (updateCampaignData) {
        updateCampaignData('processing_status', 'error');
        updateCampaignData('error_log', [errorMessage]);
      }

      return false;
    } finally {
      setIsMetaLoading(false);
    }
  }, [connection, createMetaCampaign, saveCampaignToDb, prepareLocationData, validateInstagramConnection, toast, navigate]);

  return {
    handleCreateMetaCampaign,
    isMetaLoading
  };
};
