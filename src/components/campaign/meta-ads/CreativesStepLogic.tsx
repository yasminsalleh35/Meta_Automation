
import { useMetaCampaignCreation } from '@/hooks/useMetaCampaignCreation';

interface CreativesStepLogicProps {
  creativesData: {
    campaignName: string;
    adTitle: string;
    adText: string;
    selectedFanPage: string;
    selectedInstagram: string;
    selectedWhatsApp: string;
    media: File | null;
  };
  selectedFile: File | null;
  selectedLibraryMedia: any | null;
  onCreativesChange: (field: string, value: any) => void;
  onCreateCampaign: () => void;
  fullCampaignData?: any;
}

export const useCreativesStepLogic = ({
  creativesData,
  selectedFile,
  selectedLibraryMedia,
  onCreativesChange,
  onCreateCampaign,
  fullCampaignData
}: CreativesStepLogicProps) => {
  const { handleCreateMetaCampaign, isMetaLoading } = useMetaCampaignCreation();

  const handleCreateWithAutoRepair = async () => {
    console.log('🚀 CRITICAL: Starting campaign creation with preserved data validation...');
    
    // ✅ CORRIGIDO: Garantir que objective esteja definido
    let campaignDataToUse = fullCampaignData;
    
    if (!campaignDataToUse) {
      console.warn('⚠️ CRITICAL: No full campaign data received, creating from creatives only');
      campaignDataToUse = {
        campaignName: creativesData.campaignName,
        adTitle: creativesData.adTitle,
        adText: creativesData.adText,
        selectedFanPage: creativesData.selectedFanPage,
        selectedInstagram: creativesData.selectedInstagram,
        selectedWhatsApp: creativesData.selectedWhatsApp,
        media: creativesData.media,
        objective: 'advantage_plus_leads', // ✅ CORRIGIDO: Garantir objective
        location: {
          country: 'Brasil',
          state: '',
          city: '',
          radius: 10,
          selectedLocations: []
        },
        gender: 'all',
        ageRange: { min: 18, max: 65 },
        interests: [],
        placements: ['feed'],
        devices: ['mobile', 'desktop'],
        budget: { daily: 50, total: 1000 },
        duration: { startDate: '', endDate: '' },
        destinationUrl: '',
        selectedMediaId: '',
        facebookPage: '',
        instagramAccount: '',
        whatsappNumber: ''
      };
    } else {
      // ✅ CORRIGIDO: Garantir objective e preservar dados
      campaignDataToUse = {
        ...fullCampaignData,
        // Garantir que objective esteja definido
        objective: fullCampaignData.objective || 'advantage_plus_leads',
        // Atualizar apenas campos específicos de criativos
        campaignName: creativesData.campaignName,
        adTitle: creativesData.adTitle,
        adText: creativesData.adText,
        selectedFanPage: creativesData.selectedFanPage,
        selectedInstagram: creativesData.selectedInstagram,
        selectedWhatsApp: creativesData.selectedWhatsApp,
        media: creativesData.media
      };
    }
    
    // ✅ CORRIGIDO: Melhor handling de arquivo de mídia
    let mediaFile = selectedFile || creativesData.media;
    
    if (!mediaFile && selectedLibraryMedia) {
      try {
        console.log('📁 Converting library media to File object...');
        const response = await fetch(selectedLibraryMedia.public_url);
        const blob = await response.blob();
        mediaFile = new File([blob], selectedLibraryMedia.filename, { type: selectedLibraryMedia.file_type });
        console.log('📁 Converted library media to File object:', {
          filename: selectedLibraryMedia.filename,
          type: selectedLibraryMedia.file_type,
          size: blob.size
        });
      } catch (error) {
        console.error('❌ Error converting library media to File:', error);
        return;
      }
    }
    
    if (!mediaFile) {
      console.error('❌ No media file available for campaign creation');
      return;
    }

    // ✅ CORRIGIDO: Atualizar mídia nos dados da campanha
    campaignDataToUse.media = mediaFile;

    // ✅ CORRIGIDO: Log detalhado dos dados preservados
    console.log('📋 CRITICAL: Final campaign data with all corrections:', {
      hasObjective: !!campaignDataToUse.objective,
      objective: campaignDataToUse.objective,
      hasLocation: !!campaignDataToUse.location,
      hasSelectedLocations: !!campaignDataToUse.location?.selectedLocations,
      selectedLocationsCount: campaignDataToUse.location?.selectedLocations?.length || 0,
      locationDetails: campaignDataToUse.location?.selectedLocations?.map(loc => ({
        name: loc.name,
        key: loc.key,
        type: loc.type
      })) || [],
      creativesInfo: {
        campaignName: campaignDataToUse.campaignName,
        adTitle: campaignDataToUse.adTitle,
        hasMedia: !!campaignDataToUse.media,
        selectedFanPage: campaignDataToUse.selectedFanPage,
        selectedInstagram: campaignDataToUse.selectedInstagram
      },
      timestamp: new Date().toISOString()
    });

    await handleCreateMetaCampaign(
      campaignDataToUse,
      async () => {
        await onCreateCampaign();
        return 'campaign-id';
      },
      onCreativesChange
    );
  };

  return {
    handleCreateWithAutoRepair,
    isMetaLoading
  };
};
