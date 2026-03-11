
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { SimpleCampaignFormData, SimpleCampaignPayload, SimpleCampaignWizardStep } from '@/types/simpleCampaign.types';
import { useMetaAdsIntegration } from '@/hooks/useMetaAdsIntegration';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';

const initialFormData: SimpleCampaignFormData = {
  campaignName: '',
  adTitle: '',
  adText: '',
  fanpage: '',
  instagram: '',
  whatsappNumber: '',
  whatsappLink: '',
  selectedMediaFile: null,
  dailyBudget: 50,
  startDate: new Date(),
  city: '',
  cityCoordinates: null,
  radius: 10,
  creativeType: 'upload',
  selectedInstagramPost: null,
  useExistingInstagramPost: false,
  selectedInstagramPostId: null,
};

const steps: SimpleCampaignWizardStep[] = [
  { id: 1, title: 'Informações', description: 'Dados básicos da campanha', isComplete: false, isActive: true },
  { id: 2, title: 'Mídia', description: 'Imagem ou vídeo do anúncio', isComplete: false, isActive: false },
  { id: 3, title: 'Orçamento', description: 'Investimento e cronograma', isComplete: false, isActive: false },
  { id: 4, title: 'Localização', description: 'Público e região', isComplete: false, isActive: false }
];

// ✅ NOVO: Função utilitária para canonizar WhatsApp link
const buildWhatsappLink = (input: string): string | null => {
  if (!input) return null;
  
  // Se já é um link, validar e normalizar
  if (input.startsWith('http')) {
    const waRegex = /https:\/\/(wa\.me|api\.whatsapp\.com\/send\?phone=)(\d+)/;
    const match = input.match(waRegex);
    if (match && match[2] && match[2].length >= 8) {
      return `https://wa.me/${match[2]}`;
    }
    return null;
  }
  
  // Se é número, limpar e montar link
  const cleanNumber = input.replace(/\D/g, '');
  if (cleanNumber.length >= 8) {
    return `https://wa.me/${cleanNumber}`;
  }
  
  return null;
};

export const useSimpleCampaignWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SimpleCampaignFormData>(initialFormData);
  const [wizardSteps, setWizardSteps] = useState(steps);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitProgress, setSubmitProgress] = useState<{
    stage: 'idle' | 'validating' | 'uploading' | 'creating-campaign' | 'creating-adset' | 'creating-creative' | 'creating-ad' | 'saving' | 'done';
    message: string;
  }>({
    stage: 'idle',
    message: ''
  });
  const { toast } = useToast();
  const supabase = useSupabase();
  const { existingIntegration } = useMetaAdsIntegration();
  const { businessData } = useBusinessSettings();

  // ✅ Auto-popular WhatsApp de business_settings
  useEffect(() => {
    if (businessData.whatsappNumber && !formData.whatsappNumber) {
      console.log('✅ Auto-populando WhatsApp de business_settings:', businessData.whatsappNumber);
      updateFormData('whatsappNumber', businessData.whatsappNumber);
      
      toast({
        title: "WhatsApp preenchido automaticamente",
        description: `Usando ${businessData.whatsappNumber} do seu negócio`,
        duration: 3000
      });
    }
  }, [businessData.whatsappNumber]);

  const updateFormData = (field: keyof SimpleCampaignFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ✅ Limpeza de estado ao alternar creativeType
  useEffect(() => {
    if (formData.creativeType === 'upload') {
      setFormData(prev => ({
        ...prev,
        // limpar campos do modo post
        selectedInstagramPost: null,
        selectedInstagramPostId: null,
        useExistingInstagramPost: false
      }));
    } else if (formData.creativeType === 'post') {
      setFormData(prev => ({
        ...prev,
        // limpar campos do modo upload
        selectedMediaFile: null
      }));
    }
  }, [formData.creativeType]);

  const validateCurrentStep = (): boolean => {
    console.log(`[VALIDATION] Validating step ${currentStep}`);
    console.log('[VALIDATION] Form data:', formData);
    
    switch (currentStep) {
      case 1:
        // Step 1: Only validate basic campaign info fields that are actually collected
        const step1Valid = !!(formData.campaignName && formData.adTitle && formData.adText);
        console.log('[VALIDATION] Step 1 validation:', {
          campaignName: !!formData.campaignName,
          adTitle: !!formData.adTitle,
          adText: !!formData.adText,
          isValid: step1Valid
        });
        return step1Valid;
      case 2:
        // Step 2: Validate media file and Meta assets
        const hasMedia = formData.creativeType === 'upload' 
          ? !!formData.selectedMediaFile 
          : !!formData.selectedInstagramPost;
        
        // ✅ CTWA NATIVO: WhatsApp NÃO é obrigatório
        // O promoted_object.page_id será usado para buscar o WA automaticamente
        const step2Valid = formData.creativeType === 'upload'
          ? !!(hasMedia && formData.fanpage) // ✅ Apenas mídia + fanpage
          : !!(hasMedia && formData.fanpage && formData.instagram); // Post IG precisa do Instagram
          
        console.log('[VALIDATION] Step 2 validation (CTWA Native Mode):', {
          creativeType: formData.creativeType,
          selectedMediaFile: !!formData.selectedMediaFile,
          selectedInstagramPost: !!formData.selectedInstagramPost,
          hasMedia,
          fanpage: !!formData.fanpage,
          instagram: !!formData.instagram,
          whatsappNumber: !!formData.whatsappNumber,
          note: 'WhatsApp NÃO é obrigatório - será buscado via promoted_object.page_id',
          isValid: step2Valid
        });
        return step2Valid;
      case 3:
        // Step 3: Validate budget
        const step3Valid = formData.dailyBudget >= 30;
        console.log('[VALIDATION] Step 3 validation:', {
          dailyBudget: formData.dailyBudget,
          isValid: step3Valid
        });
        return step3Valid;
      case 4:
        // Step 4: Validate location
        const step4Valid = !!(formData.city && formData.cityCoordinates);
        console.log('[VALIDATION] Step 4 validation:', {
          city: !!formData.city,
          cityCoordinates: !!formData.cityCoordinates,
          isValid: step4Valid
        });
        return step4Valid;
      default:
        return false;
    }
  };

  const updateStepStatus = (stepId: number, isComplete: boolean, isActive: boolean) => {
    setWizardSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { ...step, isComplete, isActive }
        : step.id < stepId 
          ? { ...step, isComplete: true, isActive: false }
          : { ...step, isComplete: false, isActive: false }
    ));
  };

  const nextStep = () => {
    console.log(`[WIZARD] Attempting to go from step ${currentStep} to ${currentStep + 1}`);
    
    // ✅ RELATÓRIO: Log detalhado ao avançar para Step 3
    if (currentStep === 2) {
      console.log('🔍 [DIAGNOSTIC-REPORT] ADVANCING TO STEP 3 - FORM DATA ANALYSIS:');
      console.log('📋 [FORM-DATA] Complete form structure:', {
        timestamp: new Date().toISOString(),
        currentStep,
        formData: {
          creativeType: formData.creativeType,
          useExistingInstagramPost: formData.useExistingInstagramPost,
          selectedInstagramPostId: formData.selectedInstagramPostId,
          instagram: formData.instagram,
          fanpage: formData.fanpage,
          selectedMediaMeta: formData.selectedMediaFile ? {
            file_type: formData.selectedMediaFile.file_type,
            public_url: formData.selectedMediaFile.public_url,
            filename: formData.selectedMediaFile.filename,
            id: formData.selectedMediaFile.id
          } : null,
          whatsappNumber: formData.whatsappNumber,
          whatsappLink: formData.whatsappLink,
          campaignName: formData.campaignName,
          adTitle: formData.adTitle,
          adText: formData.adText
        }
      });
      
      console.log('🎯 [FLOW-ANALYSIS] Upload vs Existing Post Flow:', {
        selectedFlow: formData.creativeType,
        isUploadFlow: formData.creativeType === 'upload',
        isExistingPostFlow: formData.creativeType === 'post',
        hasMediaFile: !!formData.selectedMediaFile,
        hasInstagramPost: !!formData.selectedInstagramPost,
        instagramActorIdSource: formData.creativeType === 'upload' ? 'from_integration_backend' : 'derived_from_post',
        whatsappRequired: formData.creativeType === 'upload',
        whatsappProvided: !!(formData.whatsappNumber || formData.whatsappLink)
      });
    }
    
    if (currentStep < steps.length && validateCurrentStep()) {
      updateStepStatus(currentStep, true, false);
      const nextStepNum = currentStep + 1;
      setCurrentStep(nextStepNum);
      updateStepStatus(nextStepNum, false, true);
      console.log(`[WIZARD] Successfully moved to step ${nextStepNum}`);
    } else {
      console.log('[WIZARD] Cannot proceed - validation failed');
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const prevStepNum = currentStep - 1;
      setCurrentStep(prevStepNum);
      updateStepStatus(prevStepNum, false, true);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setFormData(initialFormData);
    setWizardSteps(steps);
    setIsSubmitting(false);
  };

  // Retry helper with exponential backoff
  const invokeFunctionWithRetry = async <T,>(
    functionName: string,
    payload: any,
    maxRetries = 2,
  ): Promise<T> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          console.log(`🔄 Retry ${attempt}/${maxRetries} for ${functionName}`);
          setSubmitProgress({ 
            stage: 'creating-campaign', 
            message: `Tentativa ${attempt + 1} de ${maxRetries + 1}...` 
          });
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // backoff
        }
        
        const response = await supabase.functions.invoke(functionName, {
          body: payload
        });
        
        if (response.error) {
          throw new Error(response.error.message);
        }
        
        return response.data as T;
        
      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Attempt ${attempt + 1} failed:`, error);
        
        // Don't retry on validation errors (4xx)
        if (error instanceof Error && error.message.includes('validation')) {
          throw error;
        }
      }
    }
    
    throw lastError || new Error('Function invocation failed after retries');
  };

  const submitCampaign = async () => {
    try {
      setIsSubmitting(true);
      setSubmitProgress({ stage: 'validating', message: 'Validando dados da campanha...' });

      // Log detalhado do submit da campanha conforme especificação
      console.log('🔍 [SUBMIT] CAMPAIGN SUBMISSION STARTED:');
      console.log('📋 [SUBMIT-FORM-DATA] Resumo do payload (sem arquivos):', {
        timestamp: new Date().toISOString(),
        creativeType: formData.creativeType,
        fanpage: formData.fanpage,
        instagram: formData.instagram,
        hasSelectedMediaMeta: !!formData.selectedMediaFile,
        useExistingInstagramPost: formData.useExistingInstagramPost,
        selectedInstagramPostId: formData.selectedInstagramPostId,
        campaignName: formData.campaignName,
        city: formData.city,
        dailyBudget: formData.dailyBudget
      });

      // Canonizar WhatsApp link usando função utilitária
      const whatsappLink = buildWhatsappLink(formData.whatsappNumber || formData.whatsappLink);

      console.log('🔗 [WHATSAPP-PROCESSING] WhatsApp link canonization:', {
        original_whatsapp_number: formData.whatsappNumber,
        original_whatsapp_link: formData.whatsappLink,
        canonized_whatsapp_link: whatsappLink,
        is_valid: !!whatsappLink,
        note: 'Se não fornecido, backend usará promoted_object.page_id'
      });

      // ✅ CTWA NATIVO: WhatsApp opcional no upload flow
      // Backend usa promoted_object.page_id se whatsappLink for null
      if (formData.creativeType === 'upload' && !whatsappLink && !formData.fanpage) {
        console.log('❌ [VALIDATION-FAILED] Fanpage é obrigatória para CTWA');
        toast({
          variant: "destructive",
          title: "Fanpage obrigatória",
          description: "Selecione uma Página do Facebook para criar a campanha."
        });
        return { success: false, error: "Fanpage obrigatória" };
      }

      if (formData.creativeType === 'post' && (!formData.instagram || !formData.selectedInstagramPostId)) {
        console.log('❌ [VALIDATION-FAILED] Instagram data validation failed for existing post flow');
        toast({
          variant: "destructive", 
          title: "Dados do Instagram ausentes",
          description: "Selecione uma conta do Instagram e um post para promover."
        });
        return { success: false, error: "Dados do Instagram ausentes" };
      }

      // ✅ NOVO: Preparar dados da mídia para upload na Meta API
      const selectedMediaMeta = formData.selectedMediaFile ? {
        file_type: formData.selectedMediaFile.file_type,
        public_url: formData.selectedMediaFile.public_url,
        filename: formData.selectedMediaFile.filename
      } : null;

      console.log('📷 [MEDIA-PREPARATION] Media metadata for Meta API:', {
        has_media_file: !!formData.selectedMediaFile,
        selectedMediaMeta,
        is_upload_flow: formData.creativeType === 'upload',
        is_existing_post_flow: formData.creativeType === 'post'
      });

      // ✅ NOVO: Preparar dados do WhatsApp Business (REMOVIDO)
      // Não será mais necessário pois agora é CTWA exclusivo

      // ✅ Payload discriminado por creativeType (campos que a Edge precisa)
      const commonPayload = {
        campaignName: formData.campaignName,
        adTitle: formData.adTitle,
        adText: formData.adText,
        fanpage: formData.fanpage,
        instagram: formData.instagram,
        whatsappLink,
        dailyBudget: formData.dailyBudget,
        startDate: formData.startDate.toISOString(),
        city: formData.city,
        cityCoordinates: formData.cityCoordinates,
        radius: formData.radius,
        campaignType: 'traffic',
        status: 'PAUSED',
        gender: 'all',
        ageMin: 18,
        ageMax: 65,
        specialCategories: [],
        // ✅ NOVO: Localização internacional
        countryCode: formData.countryCode || 'BR',
        selected_locations: formData.selected_locations || []
        // ✅ Removidos: billing_event, optimization_goal, devices, platforms, placements
        // A Edge força esses valores para ROTA A
      };

      let payload: SimpleCampaignPayload;

      if (formData.creativeType === 'upload') {
        payload = {
          ...commonPayload,
          creativeType: 'upload',
          mediaFileId: formData.selectedMediaFile?.id || null,
          mediaUrl: formData.selectedMediaFile?.public_url || null,
          selectedMediaMeta, // ✅ Dados da mídia para Meta API
          useExistingInstagramPost: false,
          selectedInstagramPostId: null
        };
      } else {
        payload = {
          ...commonPayload,
          creativeType: 'post',
          selectedInstagramPostId: formData.selectedInstagramPost?.id!, // MEDIA_ID
          instagramUserId: formData.selectedInstagramPost?.instagram_user_id || formData.instagram, // ✅ FASE 3: instagram_user_id
          useExistingInstagramPost: true,
          mediaFileId: null,
          mediaUrl: null,
          selectedMediaMeta: null
        };
      }

      console.log('🚀 [PAYLOAD-ANALYSIS] Final payload sendo enviado à edge function:', {
        timestamp: new Date().toISOString(),
        creativeType: payload.creativeType,
        fanpage: payload.fanpage,
        instagram: payload.instagram,
        whatsappLink: payload.whatsappLink,
        hasSelectedMediaMeta: !!payload.selectedMediaMeta,
        useExistingInstagramPost: payload.useExistingInstagramPost,
        selectedInstagramPostId: payload.selectedInstagramPostId,
        // Conforme especificação: não deriva instagram_actor_id no frontend
        backend_responsibility: 'Backend deve validar instagram_actor_id via integração'
      });

      setSubmitProgress({ stage: 'uploading', message: 'Enviando mídia para o Meta Ads...' });
      
      // 🔄 Usar função com retry
      const result = await invokeFunctionWithRetry<{success: boolean, data: any, error?: string}>(
        'simple-campaign-create',
        payload,
        2 // 2 retries
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Erro ao criar campanha');
      }

      setSubmitProgress({ stage: 'done', message: 'Campanha criada com sucesso!' });
      
      return { success: true, data: result.data };
    } catch (error) {
      console.error('❌ Erro ao criar campanha:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      setIsSubmitting(false);
      setSubmitProgress({ stage: 'idle', message: '' });
    }
  };

  return {
    currentStep,
    formData,
    steps: wizardSteps,
    isSubmitting,
    submitProgress,
    updateFormData,
    validateCurrentStep,
    nextStep,
    prevStep,
    submitCampaign,
    resetWizard
  };
};
