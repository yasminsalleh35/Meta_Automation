
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useResponsive } from '@/hooks/useResponsive';

interface MobileWizardStepProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  canProceed: boolean;
  onNext?: () => void;
  onPrevious?: () => void;
  onFinish?: () => void;
  isLoading?: boolean;
}

export const MobileWizardStep: React.FC<MobileWizardStepProps> = ({
  title,
  subtitle,
  icon,
  children,
  currentStep,
  totalSteps,
  canProceed,
  onNext,
  onPrevious,
  onFinish,
  isLoading = false
}) => {
  const { isMobile } = useResponsive();
  const isLastStep = currentStep === totalSteps;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex flex-col">
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-lg">
                {icon}
              </div>
            )}
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="text-sm text-gray-500">{subtitle}</p>
              )}
            </div>
          </div>
          <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {currentStep}/{totalSteps}
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-1">
            <div 
              className="bg-blue-600 h-1 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {isMobile ? (
          <div className="space-y-4">
            {children}
          </div>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                {icon && (
                  <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-xl">
                    {icon}
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold">{title}</h2>
                  {subtitle && <p className="text-gray-600">{subtitle}</p>}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {children}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Fixed Bottom Actions */}
      <div className="bg-white border-t border-gray-200 p-4 sticky bottom-0">
        <div className="flex items-center justify-between gap-4 max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={onPrevious}
            disabled={currentStep === 1}
            className="flex items-center gap-2 min-w-[100px]"
          >
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>

          {isLastStep ? (
            <Button
              onClick={onFinish}
              disabled={!canProceed || isLoading}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 min-w-[120px]"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Criando...
                </>
              ) : (
                <>
                  Criar Campanha
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={onNext}
              disabled={!canProceed}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 min-w-[100px]"
            >
              Próximo
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
