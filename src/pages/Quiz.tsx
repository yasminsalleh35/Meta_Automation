import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { StepAbout } from '@/components/quiz/StepAbout';
import { StepMarketing } from '@/components/quiz/StepMarketing';
import { StepBudgetGoal } from '@/components/quiz/StepBudgetGoal';
import { StepContact } from '@/components/quiz/StepContact';
import { StepReview } from '@/components/quiz/StepReview';
import { QuizThankYou } from '@/components/quiz/QuizThankYou';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface QuizData {
  // Step 1 - About
  name: string;
  clinic_name: string;
  city: string;
  state: string;
  specialty: string;
  specialties: string[];
  
  // Step 2 - Marketing
  used_paid_traffic: "never" | "past" | "current" | "";
  platforms: string[];
  prev_monthly_spend: number;
  expectations: string;
  
  // Step 3 - Budget & Goal
  desired_monthly_spend_range: string;
  main_goal: string;
  start_timing: string;
  
  // Step 4 - Contact
  whatsapp: string;
  email: string;
  best_contact_time: string;
  preferred_channel: string;
  instagram: string;
  website: string;
  notes: string;
  
  // Step 5 - Review & Consent
  consent: boolean;
  
  // Hidden honeypot
  company: string;
}

const initialData: QuizData = {
  name: "",
  clinic_name: "",
  city: "",
  state: "",
  specialty: "",
  specialties: [],
  used_paid_traffic: "",
  platforms: [],
  prev_monthly_spend: 0,
  expectations: "",
  desired_monthly_spend_range: "",
  main_goal: "",
  start_timing: "",
  whatsapp: "",
  email: "",
  best_contact_time: "",
  preferred_channel: "",
  instagram: "",
  website: "",
  notes: "",
  consent: false,
  company: "", // honeypot
};

const Quiz: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<QuizData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const { toast } = useToast();

  // Capture UTM parameters and device info on mount
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
    
    // Store in sessionStorage for later use in submission
    sessionStorage.setItem('quiz_utm', JSON.stringify(utmData));
    sessionStorage.setItem('quiz_referrer', document.referrer || '');
    sessionStorage.setItem('quiz_device', deviceInfo);
    sessionStorage.setItem('quiz_page_path', window.location.pathname);
  }, []);

  const updateData = (field: keyof QuizData, value: any) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return data.name && data.clinic_name && data.city && data.state && data.specialty;
      case 1: return data.used_paid_traffic !== "";
      case 2: return data.desired_monthly_spend_range && data.main_goal && data.start_timing;
      case 3: return data.whatsapp && data.email;
      case 4: return data.consent;
      default: return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setIsSubmitting(true);

    try {
      // Get tracking data from sessionStorage
      const utmData = JSON.parse(sessionStorage.getItem('quiz_utm') || '{}');
      const referrer = sessionStorage.getItem('quiz_referrer') || '';
      const device = sessionStorage.getItem('quiz_device') || '';
      const pagePath = sessionStorage.getItem('quiz_page_path') || '';

      const submissionData = {
        ...data,
        utm: utmData,
        referrer,
        device,
        page_path: pagePath,
        answers: data, // Store complete answers for reference
      };

      console.log('🚀 Submitting quiz data:', submissionData);

      const { error } = await supabase.functions.invoke('lead-quiz-submit', {
        body: submissionData,
      });

      if (error) {
        console.error('❌ Submission error:', error);
        toast({
          title: "Erro ao enviar",
          description: "Ocorreu um erro ao enviar suas respostas. Tente novamente.",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Quiz submitted successfully');
      setIsComplete(true);
      
      // Clear tracking data
      sessionStorage.removeItem('quiz_utm');
      sessionStorage.removeItem('quiz_referrer');
      sessionStorage.removeItem('quiz_device');
      sessionStorage.removeItem('quiz_page_path');

      toast({
        title: "Obrigado!",
        description: "Suas respostas foram enviadas com sucesso.",
      });

    } catch (error) {
      console.error('❌ Unexpected error:', error);
      toast({
        title: "Erro inesperado",
        description: "Algo deu errado. Tente novamente em alguns minutos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { title: "Sobre você", component: <StepAbout data={data} updateData={updateData} /> },
    { title: "Marketing", component: <StepMarketing data={data} updateData={updateData} /> },
    { title: "Orçamento", component: <StepBudgetGoal data={data} updateData={updateData} /> },
    { title: "Contato", component: <StepContact data={data} updateData={updateData} /> },
    { title: "Revisão", component: <StepReview data={data} updateData={updateData} /> },
  ];

  if (isComplete) {
    return <QuizThankYou data={data} />;
  }

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Descubra o plano ideal para sua clínica
          </h1>
          <p className="text-gray-600">
            Responda algumas perguntas e receba uma estratégia personalizada
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
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
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                {steps[currentStep].title}
              </h2>
              {steps[currentStep].component}
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
              disabled={!canProceed() || isSubmitting}
              className="flex items-center gap-2"
            >
              {isSubmitting ? "Enviando..." : "Concluir"}
            </Button>
          )}
        </div>

        {/* Honeypot field - hidden from users */}
        <input
          type="text"
          name="company"
          value={data.company}
          onChange={(e) => updateData('company', e.target.value)}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />
      </div>
    </div>
  );
};

export default Quiz;