
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, ArrowLeft, ArrowRight, Zap } from 'lucide-react';
import { useSimpleCampaignWizard } from '@/hooks/useSimpleCampaignWizard';
import { Step1Info } from './Step1_Info';
import { Step2Midia } from './Step2_Midia';
import { Step3Orcamento } from './Step3_Orcamento';
import { Step4Local } from './Step4_Local';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';

export const SimpleCampaignWizard: React.FC = () => {
  const {
    currentStep,
    formData,
    steps,
    isSubmitting,
    submitProgress,
    updateFormData,
    validateCurrentStep,
    nextStep,
    prevStep,
    submitCampaign,
    resetWizard
  } = useSimpleCampaignWizard();

  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const progress = (currentStep / steps.length) * 100;

  const handleSubmit = async () => {
    const result = await submitCampaign();
    
    if (result.success) {
      // Invalidar cache do React Query para que a listagem seja atualizada imediatamente
      await queryClient.invalidateQueries({ queryKey: ['campaigns-cache'] });
      await queryClient.invalidateQueries({ queryKey: ['meta-campaigns'] });
      
      const toastInstance = toast({
        title: "✅ Campanha criada com sucesso!",
        description: `Sua campanha "${formData.campaignName}" foi criada na Meta Ads e está pausada para revisão.\n\nRedirecionando...`,
        variant: "success" as any,
        duration: 2000
      });
      
      resetWizard();
      
      // Reduzir delay para 2 segundos (apenas para o toast ser visível)
      setTimeout(() => {
        toastInstance.dismiss();
        navigate('/dashboard/campaigns');
      }, 2000);
    } else {
      // ❌ ERRO: Mostrar mensagem de erro sem navegar
      toast({
        title: "❌ Erro ao criar campanha",
        description: result.error || "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive",
        duration: 5000
      });
    }
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Info formData={formData} updateFormData={updateFormData} />;
      case 2:
        return <Step2Midia formData={formData} updateFormData={updateFormData} />;
      case 3:
        return <Step3Orcamento formData={formData} updateFormData={updateFormData} />;
      case 4:
        return <Step4Local formData={formData} updateFormData={updateFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Loading Overlay with Progress Messages */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-2xl max-w-md w-full mx-4">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full"></div>
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white">
                  {submitProgress.message || 'Criando campanha...'}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Isso pode demorar até 30 segundos
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Por favor, não feche esta janela
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-900">Nova Campanha 2.0</h1>
          </div>
          <p className="text-gray-600">
            Crie campanhas de geração de leads no Meta Ads de forma simples e rápida
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">
              Passo {currentStep} de {steps.length}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(progress)}% concluído
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${step.isComplete 
                    ? 'bg-green-500 border-green-500 text-white' 
                    : step.isActive 
                      ? 'bg-blue-500 border-blue-500 text-white' 
                      : 'bg-white border-gray-300 text-gray-500'
                  }
                `}>
                  {step.isComplete ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-16 h-0.5 mx-2 transition-colors
                    ${step.isComplete ? 'bg-green-500' : 'bg-gray-300'}
                  `} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="mb-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 1}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </Button>

              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">
                  {steps.find(s => s.isActive)?.title}
                </p>
                <p className="text-xs text-gray-500">
                  {steps.find(s => s.isActive)?.description}
                </p>
              </div>

              {currentStep < steps.length ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                  className="flex items-center gap-2"
                >
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!validateCurrentStep() || isSubmitting}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      Criar Campanha
                    </>
                  )}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
