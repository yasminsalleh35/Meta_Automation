import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DynamicQuizStep } from '@/components/quiz/DynamicQuizStep';

interface QuizStep {
  id: string;
  order_index: number;
  type: string;
  title: string;
  subtitle: string;
  options: any[];
  field_name: string;
  required: boolean;
}

const QuizPublic: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [isComplete, setIsComplete] = useState(false);

  // Buscar quiz e steps
  const { data: quiz, isLoading } = useQuery({
    queryKey: ['public-quiz', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  const { data: steps } = useQuery({
    queryKey: ['quiz-steps', quiz?.id],
    enabled: !!quiz?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quiz_steps')
        .select('*')
        .eq('quiz_id', quiz!.id)
        .order('order_index');
      
      if (error) throw error;
      return data as QuizStep[];
    }
  });

  // Capturar dados de rastreamento
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const utmData = {
      utm_source: urlParams.get('utm_source') || '',
      utm_medium: urlParams.get('utm_medium') || '',
      utm_campaign: urlParams.get('utm_campaign') || '',
      utm_term: urlParams.get('utm_term') || '',
      utm_content: urlParams.get('utm_content') || '',
    };
    
    const deviceInfo = /Mobile|Android|iPhone|iPad/.test(navigator.userAgent) ? 'mobile' : 'desktop';
    
    sessionStorage.setItem('quiz_utm', JSON.stringify(utmData));
    sessionStorage.setItem('quiz_referrer', document.referrer || '');
    sessionStorage.setItem('quiz_device', deviceInfo);
  }, []);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const utmData = JSON.parse(sessionStorage.getItem('quiz_utm') || '{}');
      const referrer = sessionStorage.getItem('quiz_referrer') || '';
      const device = sessionStorage.getItem('quiz_device') || '';

      const { error } = await supabase.functions.invoke('quiz-submit', {
        body: {
          quiz_id: quiz!.id,
          responses,
          utm_data: utmData,
          device,
          referrer
        }
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setIsComplete(true);
      toast({
        title: "Obrigado!",
        description: "Suas respostas foram enviadas com sucesso."
      });
      
      // Limpar tracking data
      sessionStorage.removeItem('quiz_utm');
      sessionStorage.removeItem('quiz_referrer');
      sessionStorage.removeItem('quiz_device');
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const updateResponse = (fieldName: string, value: any) => {
    setResponses(prev => ({ ...prev, [fieldName]: value }));
  };

  const canProceed = () => {
    if (!steps || currentStep >= steps.length) return false;
    const currentStepData = steps[currentStep];
    if (!currentStepData.required) return true;
    
    const value = responses[currentStepData.field_name];
    return value !== undefined && value !== '' && value !== null;
  };

  const handleNext = () => {
    if (steps && currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    submitMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-camply-blue/10 via-white to-camply-green/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-camply-blue mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando quiz...</p>
        </div>
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-camply-blue/10 via-white to-camply-green/10 flex items-center justify-center">
        <div className="text-center max-w-md">
          <h1 className="text-3xl font-bold text-foreground mb-4">Quiz não encontrado</h1>
          <p className="text-muted-foreground">Este quiz não está disponível no momento.</p>
        </div>
      </div>
    );
  }

  if (isComplete) {
    const thankYouConfig = quiz.thank_you_config as any;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-camply-blue/10 via-white to-camply-green/10 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl w-full"
        >
          <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 text-center">
            <div className="mb-6">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {thankYouConfig?.title || '🎉 Quiz Concluído!'}
              </h1>
              <p className="text-lg text-muted-foreground">
                {thankYouConfig?.subtitle || 'Obrigado por suas respostas!'}
              </p>
            </div>
            
            <div className="bg-camply-blue/10 rounded-lg p-6 mb-6">
              <p className="text-foreground">
                Em breve nossa equipe entrará em contato com você para apresentar
                as melhores soluções para o seu negócio.
              </p>
            </div>
            
            {thankYouConfig?.ctaUrl && (
              <Button
                size="lg"
                onClick={() => window.location.href = thankYouConfig.ctaUrl}
                className="w-full md:w-auto"
              >
                {thankYouConfig?.ctaText || 'Continuar'}
              </Button>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  if (!steps || steps.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-camply-blue/10 via-white to-camply-green/10 flex items-center justify-center">
        <p className="text-muted-foreground">Quiz ainda não configurado</p>
      </div>
    );
  }

  const progress = ((currentStep + 1) / steps.length) * 100;
  const currentStepData = steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-camply-blue/10 via-white to-camply-green/10 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">{quiz.name}</h1>
          <p className="text-muted-foreground">{quiz.description}</p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-muted-foreground mb-2">
            <span>Etapa {currentStep + 1} de {steps.length}</span>
            <span>{Math.round(progress)}% completo</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <DynamicQuizStep
                step={currentStepData}
                value={responses[currentStepData.field_name]}
                onChange={(value) => updateResponse(currentStepData.field_name, value)}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 0}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </Button>

          {currentStep < steps.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2"
            >
              Próximo
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canProceed() || submitMutation.isPending}
              className="flex items-center gap-2"
            >
              {submitMutation.isPending ? "Enviando..." : "Concluir"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizPublic;
