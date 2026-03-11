
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';

interface CampaignNavigationProps {
  currentStep: number;
  totalSteps?: number;
  isStepValid: boolean;
  isLoading: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const CampaignNavigation: React.FC<CampaignNavigationProps> = ({
  currentStep,
  totalSteps = 2,
  isStepValid,
  isLoading,
  onPrevious,
  onNext,
  onSubmit
}) => {
  const isFirstStep = currentStep === 1;
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-200">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={isFirstStep || isLoading}
        className="flex items-center space-x-2"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Anterior</span>
      </Button>

      <div className="text-sm text-gray-500">
        Etapa {currentStep} de {totalSteps}
      </div>

      {isLastStep ? (
        <Button
          onClick={onSubmit}
          disabled={!isStepValid || isLoading}
          className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Criando campanha...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Criar Campanha WhatsApp</span>
            </>
          )}
        </Button>
      ) : (
        <Button
          onClick={onNext}
          disabled={!isStepValid || isLoading}
          className="flex items-center space-x-2"
        >
          <span>Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
};
