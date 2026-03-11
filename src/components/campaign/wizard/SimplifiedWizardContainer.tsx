
import React from 'react';
import { useSimplifiedWizardLogic } from '@/hooks/useSimplifiedWizardLogic';
import { WizardProgress } from './WizardProgress';
import { WizardStepRenderer } from './WizardStepRenderer';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';

const SimplifiedWizardContainer: React.FC = () => {
  const {
    currentStep,
    campaignData,
    updateCampaignData,
    updateLocationData,
    isMetaLoading,
    handleNext,
    handlePrevious,
    handleCreateCampaign,
    canProceedToNextStep,
    steps
  } = useSimplifiedWizardLogic();

  const currentStepData = steps[currentStep - 1];
  const canProceed = canProceedToNextStep(currentStep);

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

      {/* Content */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <span>{currentStepData.icon}</span>
              {currentStepData.title}
            </h2>
            <p className="text-gray-600 mt-1">{currentStepData.subtitle}</p>
          </div>

          <WizardStepRenderer
            currentStep={currentStep}
            campaignData={campaignData}
            updateCampaignData={updateCampaignData}
            updateLocationData={updateLocationData}
            onAISuggestion={() => {}} // Simplified - no AI suggestions for now
            isAILoading={false}
            handleApplySuggestions={() => {}}
            aiSuggestions={null}
          />
        </div>

        {/* Navigation */}
        <div className="px-8 pb-6 flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>

          {currentStep < 4 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="flex items-center gap-2"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleCreateCampaign}
              disabled={!canProceed || isMetaLoading}
              className="flex items-center gap-2"
            >
              {isMetaLoading ? 'Criando...' : 'Criar Campanha'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimplifiedWizardContainer;
