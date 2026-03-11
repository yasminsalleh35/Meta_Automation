import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Quiz, QuizStep } from '@/types/quiz';

export const useQuizPublic = (slug: string) => {
  const { toast } = useToast();
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);

  const { data: quiz, isLoading: isLoadingQuiz } = useQuery({
    queryKey: ['public-quiz', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('quizzes')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .single();
      
      if (error) throw error;
      return data as Quiz;
    }
  });

  const { data: steps, isLoading: isLoadingSteps } = useQuery({
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

  useEffect(() => {
    // Capturar dados de rastreamento
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

  return {
    quiz,
    steps,
    responses,
    currentStep,
    isLoading: isLoadingQuiz || isLoadingSteps,
    updateResponse,
    canProceed,
    handleNext,
    handlePrevious,
    submitQuiz: submitMutation.mutate,
    isSubmitting: submitMutation.isPending,
    isComplete: submitMutation.isSuccess
  };
};
