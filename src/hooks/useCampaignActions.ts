
import { useState } from 'react';
import { CampaignData } from '@/types/campaign';

export const useCampaignActions = (
  campaignData: CampaignData,
  setCampaignData: React.Dispatch<React.SetStateAction<CampaignData>>
) => {
  const addInterest = (interest: string) => {
    if (!campaignData.interests.includes(interest)) {
      setCampaignData(prev => ({
        ...prev,
        interests: [...prev.interests, interest]
      }));
    }
  };

  const removeInterest = (interest: string) => {
    setCampaignData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const updateCampaignData = (field: keyof CampaignData, value: any) => {
    setCampaignData(prev => ({ ...prev, [field]: value }));
  };

  const updateLocationData = (field: string, value: any) => {
    console.log('🔄 updateLocationData called:', { field, value, type: typeof value, isArray: Array.isArray(value) });
    
    setCampaignData(prev => {
      // ✅ CORREÇÃO CRÍTICA: Garantir que selectedLocations seja sempre preservado
      let updatedLocationData;
      
      if (field === 'selectedLocations') {
        // ✅ Tratar selectedLocations de forma especial
        updatedLocationData = {
          ...prev.location,
          selectedLocations: Array.isArray(value) ? value : []
        };
        
        console.log('📍 CRITICAL: selectedLocations updated:', {
          newValue: value,
          isArray: Array.isArray(value),
          count: Array.isArray(value) ? value.length : 0,
          locationNames: Array.isArray(value) ? value.map(loc => loc.name) : []
        });
      } else {
        // ✅ Preservar selectedLocations existentes para outros campos
        updatedLocationData = {
          ...prev.location,
          [field]: value,
          // GARANTIR que selectedLocations nunca seja perdido
          selectedLocations: prev.location.selectedLocations || []
        };
      }
      
      const updatedCampaignData = {
        ...prev,
        location: updatedLocationData
      };
      
      // ✅ VALIDAÇÃO: Log detalhado após atualização
      console.log('🎯 Campaign data location updated:', {
        field,
        hasSelectedLocations: !!updatedCampaignData.location.selectedLocations,
        selectedLocationsCount: updatedCampaignData.location.selectedLocations?.length || 0,
        locationNames: updatedCampaignData.location.selectedLocations?.map(loc => loc.name) || [],
        fullLocationObject: updatedCampaignData.location
      });
      
      return updatedCampaignData;
    });
  };

  return {
    addInterest,
    removeInterest,
    updateCampaignData,
    updateLocationData
  };
};
