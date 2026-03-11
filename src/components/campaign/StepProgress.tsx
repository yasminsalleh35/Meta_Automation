
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle } from 'lucide-react';

interface StepProgressProps {
  currentStep: number;
  totalSteps?: number;
}

export const StepProgress: React.FC<StepProgressProps> = ({ 
  currentStep, 
  totalSteps = 2 
}) => {
  const steps = [
    { id: 1, title: 'Configuração da Campanha', description: 'Defina público, local e orçamento' },
    { id: 2, title: 'Criativos WhatsApp', description: 'Configure anúncios e WhatsApp' }
  ];

  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Etapa {currentStep} de {totalSteps}
        </h2>
        <span className="text-sm text-gray-500">
          {Math.round(progressPercentage)}% concluído
        </span>
      </div>
      
      <Progress value={progressPercentage} className="h-2" />
      
      <div className="flex justify-between">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center space-x-3 flex-1">
            <div className="flex items-center">
              {currentStep > step.id ? (
                <CheckCircle className="w-6 h-6 text-green-500" />
              ) : currentStep === step.id ? (
                <Circle className="w-6 h-6 text-blue-500 fill-blue-500" />
              ) : (
                <Circle className="w-6 h-6 text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <h3 className={`text-sm font-medium ${
                currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title}
              </h3>
              <p className={`text-xs ${
                currentStep >= step.id ? 'text-gray-600' : 'text-gray-400'
              }`}>
                {step.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
