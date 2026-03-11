
import React from 'react';
import { LocationWizardStep } from './steps/LocationWizardStep';
import { BudgetWizardStep } from './steps/BudgetWizardStep';
import { DurationWizardStep } from './steps/DurationWizardStep';
import { CreativeWizardStep } from './steps/CreativeWizardStep';
import { CampaignData } from '@/types/campaign';

interface WizardStepRendererProps {
  currentStep: number;
  campaignData: CampaignData;
  updateCampaignData: (field: keyof CampaignData, value: any) => void;
  updateLocationData: (field: string, value: any) => void;
  onAISuggestion: () => void;
  isAILoading: boolean;
  handleApplySuggestions: (suggestions: any) => void;
  aiSuggestions: any;
}

export const WizardStepRenderer: React.FC<WizardStepRendererProps> = ({
  currentStep,
  campaignData,
  updateCampaignData,
  updateLocationData,
  onAISuggestion,
  isAILoading,
  handleApplySuggestions,
  aiSuggestions
}) => {
  switch (currentStep) {
    case 1:
      return (
        <LocationWizardStep
          campaignData={campaignData}
          updateLocationData={updateLocationData}
        />
      );
    case 2:
      return (
        <BudgetWizardStep
          campaignData={campaignData}
          updateCampaignData={updateCampaignData}
          onAISuggestion={onAISuggestion}
          isAILoading={isAILoading}
          handleApplySuggestions={handleApplySuggestions}
          aiSuggestions={aiSuggestions}
        />
      );
    case 3:
      return (
        <DurationWizardStep
          campaignData={campaignData}
          updateCampaignData={updateCampaignData}
        />
      );
    case 4:
      return (
        <CreativeWizardStep
          campaignData={campaignData}
          updateCampaignData={updateCampaignData}
          onAISuggestion={onAISuggestion}
          isAILoading={isAILoading}
          handleApplySuggestions={handleApplySuggestions}
          aiSuggestions={aiSuggestions}
          fullCampaignData={campaignData}
        />
      );
    default:
      return null;
  }
};
