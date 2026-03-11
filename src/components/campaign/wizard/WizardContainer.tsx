
import React from 'react';
import { useResponsive } from '@/hooks/useResponsive';
import { useWizardLogic } from '@/hooks/useWizardLogic';
import { WizardProgress } from './WizardProgress';
import { WizardValidationStatus } from './WizardValidationStatus';
import { WizardNavigation } from './WizardNavigation';
import { WizardStepRenderer } from './WizardStepRenderer';
import { MobileWizardStep } from '../mobile/MobileWizardStep';

const WizardContainer: React.FC = () => {
  const {
    currentStep,
    campaignData,
    updateCampaignData,
    updateLocationData,
    isAILoading,
    aiSuggestions,
    isMetaLoading,
    handleNext,
    handlePrevious,
    handleCreateMetaCampaign,
    handleAISuggestionWithObjective,
    canProceedToNextStep,
    handleApplySuggestions,
    steps
  } = useWizardLogic();

  const { isMobile } = useResponsive();

  const currentStepData = steps[currentStep - 1];
  const canProceed = canProceedToNextStep(currentStep);

  if (isMobile) {
    return (
      <MobileWizardStep
        title={currentStepData.title}
        subtitle={currentStepData.subtitle}
        icon={currentStepData.icon}
        currentStep={currentStep}
        totalSteps={steps.length}
        canProceed={canProceed}
        onNext={handleNext}
        onPrevious={handlePrevious}
        onFinish={handleCreateMetaCampaign}
        isLoading={isMetaLoading}
      >
        <WizardStepRenderer
          currentStep={currentStep}
          campaignData={campaignData}
          updateCampaignData={updateCampaignData}
          updateLocationData={updateLocationData}
          onAISuggestion={handleAISuggestionWithObjective}
          isAILoading={isAILoading}
          handleApplySuggestions={handleApplySuggestions}
          aiSuggestions={aiSuggestions}
        />
      </MobileWizardStep>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">Criar Nova Campanha</h1>
        <p className="text-gray-600">Configure sua campanha em poucos passos simples</p>
      </div>

      {/* Progress */}
      <WizardProgress 
        currentStep={currentStep} 
        totalSteps={steps.length}
        steps={steps}
      />

      {/* Validation Status */}
      <WizardValidationStatus
        steps={steps}
        currentStep={currentStep}
        canProceed={canProceed}
      />

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8">
          <WizardStepRenderer
            currentStep={currentStep}
            campaignData={campaignData}
            updateCampaignData={updateCampaignData}
            updateLocationData={updateLocationData}
            onAISuggestion={handleAISuggestionWithObjective}
            isAILoading={isAILoading}
            handleApplySuggestions={handleApplySuggestions}
            aiSuggestions={aiSuggestions}
          />
        </div>

        {/* Navigation */}
        <div className="px-8 pb-6">
          <WizardNavigation
            currentStep={currentStep}
            totalSteps={steps.length}
            canProceed={canProceed}
            onPrevious={handlePrevious}
            onNext={handleNext}
            onFinish={handleCreateMetaCampaign}
            isLoading={isMetaLoading}
            currentStepTitle={currentStepData.title}
          />
        </div>
      </div>
    </div>
  );
};

export default WizardContainer;
