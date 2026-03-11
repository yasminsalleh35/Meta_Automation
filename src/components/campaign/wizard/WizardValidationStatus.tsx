
import React from 'react';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface WizardStep {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  isValid?: boolean;
}

interface WizardValidationStatusProps {
  steps: WizardStep[];
  currentStep: number;
  canProceed: boolean;
}

export const WizardValidationStatus: React.FC<WizardValidationStatusProps> = ({
  steps,
  currentStep,
  canProceed
}) => {
  const currentStepData = steps[currentStep - 1];

  return (
    <div className="flex justify-center">
      <Badge 
        variant={canProceed ? "default" : "secondary"}
        className={`px-4 py-2 text-sm font-medium ${
          canProceed 
            ? 'bg-gradient-to-r from-camply-blue to-camply-green text-white border-0' 
            : 'bg-gray-100 text-gray-600 border-gray-200'
        }`}
      >
        {canProceed ? (
          <>
            <CheckCircle className="w-4 h-4 mr-2" />
            {currentStepData?.title} - Concluído
          </>
        ) : currentStep === steps.length ? (
          <>
            <AlertTriangle className="w-4 h-4 mr-2" />
            Preencha todos os campos para finalizar
          </>
        ) : (
          <>
            <Clock className="w-4 h-4 mr-2" />
            Complete esta etapa para continuar
          </>
        )}
      </Badge>
    </div>
  );
};
