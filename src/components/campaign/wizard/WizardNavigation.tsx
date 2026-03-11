
import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WizardNavigationProps {
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onFinish: () => void;
  isLoading: boolean;
  currentStepTitle: string;
}

export const WizardNavigation: React.FC<WizardNavigationProps> = ({
  currentStep,
  totalSteps,
  canProceed,
  onPrevious,
  onNext,
  onFinish,
  isLoading,
  currentStepTitle
}) => {
  return (
    <div className="flex justify-between items-center pt-6 border-t border-gray-100">
      <Button
        variant="outline"
        onClick={onPrevious}
        disabled={currentStep === 1}
        className="flex items-center space-x-2 px-6 py-3 border-gray-300 hover:border-camply-blue hover:text-camply-blue transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        <span>Voltar</span>
      </Button>

      <div className="text-center">
        <div className="text-sm font-medium text-gray-700">
          Etapa {currentStep} de {totalSteps}
        </div>
        <div className="text-xs text-gray-500 mt-1">
          {currentStepTitle}
        </div>
      </div>

      {currentStep < totalSteps ? (
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all ${
            canProceed 
              ? 'bg-camply-blue hover:bg-camply-blue/90 text-white shadow-md hover:shadow-lg' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          <span>Próximo</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          onClick={onFinish}
          disabled={!canProceed || isLoading}
          className={`flex items-center space-x-2 px-6 py-3 font-medium transition-all ${
            canProceed && !isLoading
              ? 'bg-gradient-to-r from-camply-blue to-camply-green hover:from-camply-blue/90 hover:to-camply-green/90 text-white shadow-md hover:shadow-lg' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Criando...</span>
            </>
          ) : (
            <>
              <span>Criar Campanha</span>
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      )}
    </div>
  );
};
