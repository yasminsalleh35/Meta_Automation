
interface CreativesFormValidatorProps {
  creativesData: {
    campaignName: string;
    adTitle: string;
    adText: string;
    selectedFanPage: string;
    media: File | null;
  };
  selectedFile: File | null;
  selectedCreatedMedia: any | null;
  selectedLibraryMedia: any | null;
  isConnected: boolean;
}

export const useCreativesFormValidator = ({
  creativesData,
  selectedFile,
  selectedCreatedMedia,
  selectedLibraryMedia,
  isConnected
}: CreativesFormValidatorProps) => {
  const isFormValid = () => {
    // Check if we have a media file from any source
    const hasMedia = selectedFile || selectedCreatedMedia || selectedLibraryMedia || creativesData.media;
    
    console.log('📋 Form validation check:', {
      campaignName: creativesData.campaignName.trim(),
      adTitle: creativesData.adTitle.trim(),
      adText: creativesData.adText.trim(),
      selectedFanPage: creativesData.selectedFanPage,
      selectedFile: !!selectedFile,
      selectedCreatedMedia: !!selectedCreatedMedia,
      selectedLibraryMedia: !!selectedLibraryMedia,
      creativesDataMedia: !!creativesData.media,
      hasMedia: !!hasMedia,
      isConnected: isConnected
    });
    
    return (
      creativesData.campaignName.trim() &&
      creativesData.adTitle.trim() &&
      creativesData.adText.trim() &&
      creativesData.selectedFanPage &&
      hasMedia &&
      isConnected
    );
  };

  return { isFormValid };
};
