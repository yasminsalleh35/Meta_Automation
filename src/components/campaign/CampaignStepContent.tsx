
import React from 'react';
import { CampaignData } from '@/hooks/useCampaignData';
import { CampaignObjectiveStep } from '@/components/campaign/CampaignObjectiveStep';
import { AISuggestionsCard } from '@/components/campaign/AISuggestionsCard';
import { LocationSettings } from '@/components/campaign/LocationSettings';
import { AudienceSettings } from '@/components/campaign/AudienceSettings';
import { CampaignSettings } from '@/components/campaign/CampaignSettings';
import { CreativesStep } from '@/components/campaign/CreativesStep';
import { LocationSettingsData } from '@/types/locationSettings';

interface CampaignStepContentProps {
  currentStep: number;
  campaignData: CampaignData;
  aiSuggestions: any;
  isAILoading: boolean;
  onObjectiveChange: (objective: string) => void;
  onLocationChange: (field: keyof LocationSettingsData, value: any) => void;
  onAudienceChange: (field: string, value: any) => void;
  onCampaignDataChange: (field: string, value: any) => void;
  onCreativesChange: (field: keyof CampaignData, value: any) => void;
  onAddInterest: (interest: string) => void;
  onRemoveInterest: (interest: string) => void;
  onGenerateSuggestions: () => void;
  onApplySuggestions?: (suggestions: any) => void;
}

export const CampaignStepContent: React.FC<CampaignStepContentProps> = ({
  currentStep,
  campaignData,
  aiSuggestions,
  isAILoading,
  onObjectiveChange,
  onLocationChange,
  onAudienceChange,
  onCampaignDataChange,
  onCreativesChange,
  onAddInterest,
  onRemoveInterest,
  onGenerateSuggestions,
  onApplySuggestions
}) => {
  if (currentStep === 1) {
    return (
      <CampaignObjectiveStep
        selectedObjective={campaignData.objective}
        onObjectiveChange={onObjectiveChange}
      />
    );
  }

  if (currentStep === 2) {
    // Convert CampaignData location to LocationSettingsData format
    const locationSettings: LocationSettingsData = {
      radius: campaignData.location.radius,
      coordinates: campaignData.location.coordinates,
      selectedAddress: campaignData.location.selectedAddress,
      selectedLocations: campaignData.location.selectedLocations.map(loc => ({
        id: loc.id || `${loc.key}-${Date.now()}`,
        name: loc.name,
        type: loc.type,
        key: loc.key,
        country_code: loc.country_code,
        region: loc.region,
        radius: loc.radius,
        distance_unit: loc.distance_unit,
        coordinates: loc.coordinates
      }))
    };

    return (
      <div className="space-y-6">
        <AISuggestionsCard
          isLoading={isAILoading}
          suggestions={aiSuggestions}
          hasObjective={!!campaignData.objective}
          onGenerateSuggestions={onGenerateSuggestions}
          onApplySuggestions={onApplySuggestions}
        />

        <LocationSettings
          location={locationSettings}
          onLocationChange={onLocationChange}
        />

        <AudienceSettings
          audience={{
            gender: campaignData.gender,
            ageRange: campaignData.ageRange,
            interests: campaignData.interests
          }}
          aiSuggestions={aiSuggestions}
          onAudienceChange={onAudienceChange}
          onAddInterest={onAddInterest}
          onRemoveInterest={onRemoveInterest}
        />

        <CampaignSettings
          campaignData={{
            placements: campaignData.placements,
            devices: campaignData.devices,
            budget: campaignData.budget,
            duration: campaignData.duration
          }}
          onCampaignDataChange={onCampaignDataChange}
        />
      </div>
    );
  }

  if (currentStep === 3) {
    return (
      <CreativesStep
        creativesData={{
          campaignName: campaignData.campaignName,
          adTitle: campaignData.adTitle,
          adText: campaignData.adText,
          destinationUrl: campaignData.destinationUrl,
          media: campaignData.media,
          selectedMediaId: campaignData.selectedMediaId,
          facebookPage: campaignData.facebookPage,
          instagramAccount: campaignData.instagramAccount,
          whatsappNumber: campaignData.whatsappNumber
        }}
        aiSuggestions={aiSuggestions}
        onCreativesChange={onCreativesChange}
      />
    );
  }

  return null;
};
