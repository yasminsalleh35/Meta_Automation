
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface WizardStep {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
}

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: WizardStep[];
}

export const WizardProgress: React.FC<WizardProgressProps> = ({ 
  currentStep, 
  totalSteps,
  steps 
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Progresso da Criação
          </span>
          <span className="text-sm text-gray-500">
            {Math.round(progressPercentage)}% concluído
          </span>
        </div>
        <Progress value={progressPercentage} className="h-3 bg-gray-100">
          <div 
            className="h-full bg-gradient-to-r from-camply-blue to-camply-green transition-all duration-300 rounded-full"
            style={{ width: `${progressPercentage}%` }}
          />
        </Progress>
      </div>

      {/* Steps Icons */}
      <div className="flex justify-between items-center">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center space-y-2">
            <div className={`relative flex items-center justify-center w-12 h-12 rounded-full border-2 transition-all duration-200 ${
              currentStep > step.id 
                ? 'bg-gradient-to-r from-camply-blue to-camply-green border-camply-green text-white shadow-md' 
                : currentStep === step.id 
                ? 'bg-camply-blue border-camply-blue text-white shadow-md' 
                : 'bg-white border-gray-300 text-gray-400'
            }`}>
              {currentStep > step.id ? (
                <CheckCircle className="w-6 h-6" />
              ) : (
                <span className="text-lg font-semibold">{step.id}</span>
              )}
            </div>
            <div className="text-center max-w-20">
              <p className={`text-xs font-medium ${
                currentStep >= step.id ? 'text-gray-900' : 'text-gray-500'
              }`}>
                {step.title.split(' ')[0]}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
