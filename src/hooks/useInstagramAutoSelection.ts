
import { useEffect } from 'react';
import { MetaAsset } from '@/components/campaign/meta-ads/types';

interface UseInstagramAutoSelectionProps {
  selectedFanPage: string;
  selectedInstagram: string;
  instagram: MetaAsset[];
  onAssetChange: (field: string, value: string) => void;
}

export const useInstagramAutoSelection = ({
  selectedFanPage,
  selectedInstagram,
  instagram,
  onAssetChange
}: UseInstagramAutoSelectionProps) => {
  
  // Auto-select Instagram when Facebook page changes
  useEffect(() => {
    if (!selectedFanPage || instagram.length === 0) {
      return;
    }

    console.log('📱 Auto-selection: Page selected:', selectedFanPage);
    console.log('📱 Auto-selection: Available Instagram accounts:', instagram);

    // Find Instagram accounts connected to the selected page
    const pageConnectedInstagram = instagram.filter(ig => ig.isPageConnected);
    console.log('📱 Auto-selection: Page-connected Instagram accounts:', pageConnectedInstagram);

    // If there's a page-connected Instagram and no Instagram is currently selected
    if (pageConnectedInstagram.length > 0 && !selectedInstagram) {
      const firstConnected = pageConnectedInstagram[0];
      console.log('📱 Auto-selection: Auto-selecting Instagram:', firstConnected);
      onAssetChange('selectedInstagram', firstConnected.id);
      return;
    }

    // If current selection is not page-connected but there are page-connected options
    if (pageConnectedInstagram.length > 0 && selectedInstagram) {
      const currentSelection = instagram.find(ig => ig.id === selectedInstagram);
      if (currentSelection && !currentSelection.isPageConnected) {
        console.log('📱 Auto-selection: Current Instagram not page-connected, switching to page-connected option');
        onAssetChange('selectedInstagram', pageConnectedInstagram[0].id);
      }
    }
  }, [selectedFanPage, instagram, selectedInstagram, onAssetChange]);

  // Clear Instagram selection when page is cleared
  useEffect(() => {
    if (!selectedFanPage && selectedInstagram) {
      console.log('📱 Auto-selection: Page cleared, clearing Instagram selection');
      onAssetChange('selectedInstagram', '');
    }
  }, [selectedFanPage, selectedInstagram, onAssetChange]);

  // Get suggested Instagram for current page
  const getSuggestedInstagram = (): MetaAsset | null => {
    if (!selectedFanPage || instagram.length === 0) return null;
    
    const pageConnected = instagram.filter(ig => ig.isPageConnected);
    return pageConnected.length > 0 ? pageConnected[0] : null;
  };

  // Check if current selection is optimal
  const isOptimalSelection = (): boolean => {
    if (!selectedInstagram || !selectedFanPage) return false;
    
    const currentSelection = instagram.find(ig => ig.id === selectedInstagram);
    return currentSelection?.isPageConnected || false;
  };

  return {
    getSuggestedInstagram,
    isOptimalSelection
  };
};
