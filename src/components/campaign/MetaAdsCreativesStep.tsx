
import React from 'react';
import { useMetaAds } from '@/hooks/useMetaAds';
import { useMetaAdsAssets } from '@/hooks/useMetaAdsAssets';
import { useMediaManagement } from '@/hooks/useMediaManagement';
import { useAIContentGeneration } from '@/hooks/useAIContentGeneration';

// Import the focused components
import { CreativesStepHeader } from './meta-ads/CreativesStepHeader';
import { ConnectionStatus } from './meta-ads/ConnectionStatus';
import { CampaignBasicInfo } from './meta-ads/CampaignBasicInfo';
import { MetaAssetsSelection } from './meta-ads/MetaAssetsSelection';
import { CreativeUpload } from './meta-ads/CreativeUpload';
import { AdContentEditor } from './meta-ads/AdContentEditor';
import { CampaignSummary } from './meta-ads/CampaignSummary';
import { useCreativesFormValidator } from './meta-ads/CreativesFormValidator';
import { useCreativesStepLogic } from './meta-ads/CreativesStepLogic';
import { CampaignData } from '@/types/campaign';

interface MetaAdsCreativesStepProps {
  creativesData: {
    campaignName: string;
    adTitle: string;
    adText: string;
    selectedFanPage: string;
    selectedInstagram: string;
    selectedWhatsApp: string;
    media: File | null;
  };
  onCreativesChange: (field: string, value: any) => void;
  onCreateCampaign: () => void;
  isLoading: boolean;
  // ✅ CRITICAL: Accept full campaign data to preserve location information
  fullCampaignData?: CampaignData;
}

export const MetaAdsCreativesStep: React.FC<MetaAdsCreativesStepProps> = ({
  creativesData,
  onCreativesChange,
  onCreateCampaign,
  isLoading,
  fullCampaignData
}) => {
  const { connection } = useMetaAds();
  const { assets, isLoading: isLoadingAssets, loadAssets, hasIntegration } = useMetaAdsAssets();
  
  const {
    selectedFile,
    filePreview,
    generatedMedia,
    selectedCreatedMedia,
    selectedLibraryMedia,
    handleFileSelect,
    handleCreatedMediaSelect,
    handleLibraryMediaSelect,
    handleClearSelection
  } = useMediaManagement(onCreativesChange);

  const {
    isGeneratingTitle,
    isGeneratingCopy,
    generateTitleWithAI,
    generateCopyWithAI
  } = useAIContentGeneration(
    (title) => onCreativesChange('adTitle', title),
    (text) => onCreativesChange('adText', text)
  );

  const { isFormValid } = useCreativesFormValidator({
    creativesData,
    selectedFile,
    selectedCreatedMedia,
    selectedLibraryMedia,
    isConnected: connection.isConnected
  });

  // ✅ CRITICAL: Pass full campaign data to logic hook
  const { handleCreateWithAutoRepair, isMetaLoading } = useCreativesStepLogic({
    creativesData,
    selectedFile,
    selectedLibraryMedia,
    onCreativesChange,
    onCreateCampaign,
    fullCampaignData // ✅ Pass the complete campaign data
  });

  // ✅ CRITICAL: Log received campaign data for debugging
  React.useEffect(() => {
    if (fullCampaignData?.location) {
      console.log('📋 CREATIVES STEP: Received full campaign data:', {
        hasLocation: !!fullCampaignData.location,
        selectedLocationsCount: fullCampaignData.location.selectedLocations?.length || 0,
        locationData: fullCampaignData.location.selectedLocations?.map(loc => ({
          name: loc.name,
          key: loc.key,
          type: loc.type
        })) || [],
        timestamp: new Date().toISOString()
      });
    } else {
      console.warn('⚠️ CREATIVES STEP: No full campaign data received or missing location');
    }
  }, [fullCampaignData]);

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <CreativesStepHeader />

      {/* Connection Status */}
      <ConnectionStatus 
        isConnected={connection.isConnected}
        adAccountId={connection.adAccountId}
        isLoadingAssets={isLoadingAssets}
        onRefresh={loadAssets}
      />

      {/* Campaign Basic Info */}
      <CampaignBasicInfo 
        campaignName={creativesData.campaignName}
        onCampaignNameChange={(name) => onCreativesChange('campaignName', name)}
      />

      {/* Meta Assets Selection */}
      <MetaAssetsSelection 
        assets={assets}
        selectedFanPage={creativesData.selectedFanPage}
        selectedInstagram={creativesData.selectedInstagram}
        selectedWhatsApp={creativesData.selectedWhatsApp}
        isLoadingAssets={isLoadingAssets}
        hasIntegration={hasIntegration}
        isConnected={connection.isConnected}
        onAssetChange={onCreativesChange}
        onRefreshAssets={loadAssets}
      />

      {/* Creative Upload */}
      <CreativeUpload 
        selectedFile={selectedFile}
        filePreview={filePreview}
        selectedCreatedMedia={selectedCreatedMedia}
        generatedMedia={generatedMedia}
        onFileSelect={handleFileSelect}
        onCreatedMediaSelect={handleCreatedMediaSelect}
        onClearSelection={handleClearSelection}
      />

      {/* Ad Content Editor */}
      <AdContentEditor 
        adTitle={creativesData.adTitle}
        adText={creativesData.adText}
        isGeneratingTitle={isGeneratingTitle}
        isGeneratingCopy={isGeneratingCopy}
        onTitleChange={(title) => onCreativesChange('adTitle', title)}
        onTextChange={(text) => onCreativesChange('adText', text)}
        onGenerateTitle={generateTitleWithAI}
        onGenerateCopy={generateCopyWithAI}
      />

      {/* Campaign Summary */}
      <CampaignSummary 
        isConnected={connection.isConnected}
        adAccountId={connection.adAccountId}
        isFormValid={isFormValid()}
        isLoading={isLoading || isMetaLoading}
        onCreateCampaign={handleCreateWithAutoRepair}
      />
    </div>
  );
};
