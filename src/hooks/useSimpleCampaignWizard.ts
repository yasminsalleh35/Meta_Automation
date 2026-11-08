
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { FunctionsHttpError } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { SimpleCampaignFormData, SimpleCampaignPayload, SimpleCampaignWizardStep } from '@/types/simpleCampaign.types';
import { useBusinessSettings } from '@/hooks/useBusinessSettings';
import { waLinkFromPhone } from '@/lib/phone';

// Fábrica (não constante de módulo): a data de início é "agora" quando o wizard abre/reinicia,
// e não o momento em que o módulo carregou (audit CMP-07).
const makeInitialFormData = (): SimpleCampaignFormData => ({
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
  endDate: null,
  city: '',
  cityCoordinates: null,
  radius: 10,
  creativeType: 'upload',
  selectedInstagramPost: null,
  useExistingInstagramPost: false,
  selectedInstagramPostId: null,
  // Phase 4.4: Scheduling
  scheduleStartTime: null,
  scheduleEndTime: null,
  enableDayparting: false,
  daypartingDays: [0, 1, 2, 3, 4, 5, 6],
  // AI targeting toggle
  useAISuggestions: false,
  aiTargeting: null,
  // WhatsApp per-campaign (null = automatic, resolved from the page's linked number)
  selectedWhatsappPhoneId: null,
  whatsapp_meta: null,
});

const steps: SimpleCampaignWizardStep[] = [
  { id: 1, title: 'Informações', description: 'Dados básicos da campanha', isComplete: false, isActive: true },
  { id: 2, title: 'Mídia', description: 'Imagem ou vídeo do anúncio', isComplete: false, isActive: false },
  { id: 3, title: 'Orçamento', description: 'Investimento e cronograma', isComplete: false, isActive: false },
  { id: 4, title: 'Localização', description: 'Público e região', isComplete: false, isActive: false }
];

const hourToMinutes = (time: string | null): number => parseInt((time || '0').split(':')[0], 10) * 60;

// ✅ Phase 4.4: Build Meta adset_schedule from dayparting config
const buildAdSchedule = (
  enabled: boolean,
  startTime: string | null,
  endTime: string | null,
  days: number[]
): Array<{ start_minute: number; end_minute: number; days: number[]; timezone_type: string }> | null => {
  if (!enabled || !startTime || !endTime || !days.length) return null;

  // Meta API uses minutes from midnight (0-1440); "24:00" = fim do dia
  const startMinute = hourToMinutes(startTime);
  const endMinute = hourToMinutes(endTime);

  // If start >= end, it means the schedule wraps around midnight — not supported in simple mode
  if (startMinute >= endMinute) return null;

  // If all day and all days, no schedule needed
  if (startMinute === 0 && endMinute >= 1440 && days.length === 7) return null;

  return [{
    start_minute: startMinute,
    end_minute: endMinute,
    days,
    // a UI diz "fuso horário da conta de anúncios" (audit CMP-07)
    timezone_type: 'ADVERTISER',
  }];
};

// Datas no fuso de São Paulo (UTC-3, sem horário de verão desde 2019), a partir do dia escolhido no calendário.
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const isToday = (d: Date) => ymd(d) === ymd(new Date());
const toStartIso = (d: Date) => (isToday(d) ? new Date().toISOString() : `${ymd(d)}T00:00:00-03:00`);
// Término = fim do dia escolhido (antes: meia-noite local via toISOString(), cortando o último dia)
const toEndIso = (d: Date) => `${ymd(d)}T23:59:59-03:00`;

// Objeto único (o projeto compila sem strictNullChecks, então união discriminada não estreita)
export interface SubmitCampaignResult {
  success: boolean;
  data?: any;
  queued?: boolean;
  code?: string;
  error?: string;
}

// supabase.functions.invoke transforma não-2xx em FunctionsHttpError: o corpo tem a mensagem real.
async function readFunctionError(error: unknown): Promise<{ code?: string; userMessage?: string }> {
  if (error instanceof FunctionsHttpError) {
    try {
      return await error.context.json();
    } catch {
      return {};
    }
  }
  return {};
}

export const useSimpleCampaignWizard = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SimpleCampaignFormData>(makeInitialFormData);
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
  const { businessData } = useBusinessSettings();
  // audit CMP-08: uma chave por "abertura" do wizard; reenvios/duplo clique reutilizam a mesma
  const idempotencyKeyRef = useRef<string>(crypto.randomUUID());
  const submittingRef = useRef(false);

  // Estável entre renders: os efeitos dos steps dependem dela (audit CMP-04)
  const updateFormData = useCallback((field: keyof SimpleCampaignFormData, value: any) => {
    setFormData(prev => (prev[field] === value ? prev : { ...prev, [field]: value }));
  }, []);

  // ✅ Auto-popular WhatsApp de business_settings
  useEffect(() => {
    if (businessData.whatsappNumber && !formData.whatsappNumber) {
      updateFormData('whatsappNumber', businessData.whatsappNumber);

      toast({
        title: "WhatsApp preenchido automaticamente",
        description: `Usando ${businessData.whatsappNumber} do seu negócio`,
        duration: 3000
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessData.whatsappNumber]);

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

  // Calculada uma vez por mudança de dados, não a cada render (audit CMP-04)
  const isCurrentStepValid = useMemo((): boolean => {
    switch (currentStep) {
      case 1:
        return !!(formData.campaignName && formData.adTitle && formData.adText);
      case 2: {
        const hasMedia = formData.creativeType === 'upload'
          ? !!formData.selectedMediaFile
          : !!formData.selectedInstagramPost;
        // ✅ CTWA NATIVO: WhatsApp NÃO é obrigatório (resolvido pela Página via promoted_object.page_id),
        // mas um número digitado precisa ser válido.
        const whatsappOk = !formData.whatsappNumber || !!waLinkFromPhone(formData.whatsappNumber);
        return whatsappOk && (formData.creativeType === 'upload'
          ? !!(hasMedia && formData.fanpage)
          : !!(hasMedia && formData.fanpage && formData.instagram));
      }
      case 3: {
        const budgetOk = formData.dailyBudget >= 30;
        let scheduleOk = true;
        if (formData.enableDayparting) {
          // Meta API requires end_time when using adset_schedule
          if (!formData.endDate) scheduleOk = false;
          if (formData.scheduleStartTime && formData.scheduleEndTime &&
              hourToMinutes(formData.scheduleStartTime) >= hourToMinutes(formData.scheduleEndTime)) {
            scheduleOk = false;
          }
          if (!formData.daypartingDays || formData.daypartingDays.length === 0) scheduleOk = false;
        }
        return budgetOk && scheduleOk;
      }
      case 4:
        // A lista é o que vai para a Meta: sem localização, sem avanço (audit CMP-05)
        return (formData.selected_locations?.length ?? 0) > 0;
      default:
        return false;
    }
  }, [currentStep, formData]);

  const validateCurrentStep = useCallback(() => isCurrentStepValid, [isCurrentStepValid]);

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
    if (currentStep < steps.length && isCurrentStepValid) {
      updateStepStatus(currentStep, true, false);
      const nextStepNum = currentStep + 1;
      setCurrentStep(nextStepNum);
      updateStepStatus(nextStepNum, false, true);
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
    setFormData(makeInitialFormData());
    setWizardSteps(steps);
    setIsSubmitting(false);
    idempotencyKeyRef.current = crypto.randomUUID();
  };

  const submitCampaign = async (): Promise<SubmitCampaignResult> => {
    // Duplo clique: a segunda chamada nem sai do navegador (o servidor também barra pela chave)
    if (submittingRef.current) return { success: false, code: 'IN_PROGRESS', error: 'A campanha já está sendo criada.' };
    submittingRef.current = true;

    // Timers used to advance the progress message while the single long-running edge call is
    // in flight (there is no server push). Always cleared in `finally`.
    const progressTimers: ReturnType<typeof setTimeout>[] = [];
    try {
      setIsSubmitting(true);
      setSubmitProgress({ stage: 'validating', message: 'Validando dados da campanha...' });

      const whatsappLink = waLinkFromPhone(formData.whatsappNumber || formData.whatsappLink);
      if ((formData.whatsappNumber || formData.whatsappLink) && !whatsappLink) {
        return { success: false, code: 'INVALID_WHATSAPP', error: 'O número de WhatsApp informado é inválido. Use DDD + número.' };
      }

      if (!formData.fanpage) {
        return { success: false, code: 'PAGE_NOT_ALLOWED', error: 'Selecione uma Página do Facebook para criar a campanha.' };
      }

      if (formData.creativeType === 'post' && (!formData.instagram || !formData.selectedInstagramPostId)) {
        return { success: false, code: 'IG_MEDIA_MISSING', error: 'Selecione uma conta do Instagram e um post para promover.' };
      }

      if (!formData.selected_locations?.length) {
        return { success: false, code: 'NO_LOCATION', error: 'Escolha pelo menos uma cidade ou estado.' };
      }

      // ✅ NOVO: Preparar dados da mídia para upload na Meta API
      const selectedMediaMeta = formData.selectedMediaFile ? {
        file_type: formData.selectedMediaFile.file_type,
        public_url: formData.selectedMediaFile.public_url,
        filename: formData.selectedMediaFile.filename
      } : null;

      // ✅ Payload discriminado por creativeType (campos que a Edge precisa)
      const commonPayload = {
        idempotencyKey: idempotencyKeyRef.current,
        campaignName: formData.campaignName,
        adTitle: formData.adTitle,
        adText: formData.adText,
        fanpage: formData.fanpage,
        instagram: formData.instagram,
        whatsappLink: whatsappLink || '',
        dailyBudget: formData.dailyBudget,
        startDate: toStartIso(formData.startDate),
        endDate: formData.endDate ? toEndIso(formData.endDate) : null,
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
        selected_locations: formData.selected_locations,
        // ✅ Phase 4.4: Scheduling — dayparting
        scheduleStartTime: formData.enableDayparting ? formData.scheduleStartTime : null,
        scheduleEndTime: formData.enableDayparting ? formData.scheduleEndTime : null,
        enableDayparting: formData.enableDayparting || false,
        daypartingDays: formData.enableDayparting ? (formData.daypartingDays || [0,1,2,3,4,5,6]) : undefined,
        // AI targeting toggle
        useAISuggestions: formData.useAISuggestions || false,
        aiTargeting: formData.aiTargeting || null,
        // ✅ WhatsApp por campanha (opcional; vazio = número da página)
        selectedWhatsappPhoneId: formData.selectedWhatsappPhoneId || null,
        whatsapp_meta: formData.whatsapp_meta || null,
        adSchedule: formData.endDate
          ? buildAdSchedule(
              formData.enableDayparting || false,
              formData.scheduleStartTime || null,
              formData.scheduleEndTime || null,
              formData.daypartingDays || [0,1,2,3,4,5,6]
            )
          : null, // Meta API requires end_time for adset_schedule
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

      setSubmitProgress({ stage: 'uploading', message: 'Enviando mídia para o Meta Ads...' });

      // The edge function does the whole Meta creation server-side (media upload + campaign +
      // ad set + creative + ad). When the media is a VIDEO, Meta needs time to process it, so
      // the call can legitimately take up to ~2 minutes. There is no progress stream, so advance
      // the message on a timer — otherwise the user stares at a frozen "Enviando mídia" and
      // assumes it hung (exactly the report we got).
      const showAfter = (delayMs: number, message: string) =>
        progressTimers.push(setTimeout(() => setSubmitProgress({ stage: 'creating-campaign', message }), delayMs));
      showAfter(12_000, 'Processando a mídia no Meta Ads (vídeos podem levar até 2 min)...');
      showAfter(45_000, 'Criando a campanha e o anúncio...');
      showAfter(90_000, 'Quase lá, finalizando a criação...');

      // Sem retry no cliente: a idempotência é garantida pela chave no servidor (audit CMP-08).
      const { data, error } = await supabase.functions.invoke('simple-campaign-create', { body: payload });

      if (error) {
        const body = await readFunctionError(error);
        return {
          success: false,
          code: body.code,
          error: body.userMessage || 'Não foi possível criar a campanha. Tente novamente em instantes.'
        };
      }

      // 202: pedido recebido, NÃO criado (audit CMP-01)
      if (data?.status === 'queued') {
        return { success: false, queued: true, code: data.code, error: data.userMessage };
      }

      if (!data?.success || data.status !== 'created') {
        return { success: false, code: data?.code, error: data?.userMessage || 'Erro ao criar campanha' };
      }

      setSubmitProgress({ stage: 'done', message: 'Campanha criada com sucesso!' });
      return { success: true, data };
    } catch (error) {
      console.error('❌ Erro ao criar campanha:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      };
    } finally {
      progressTimers.forEach(t => clearTimeout(t));
      submittingRef.current = false;
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
    isCurrentStepValid,
    nextStep,
    prevStep,
    submitCampaign,
    resetWizard
  };
};
