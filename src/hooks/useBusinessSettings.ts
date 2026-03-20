import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

export interface BusinessData {
  name: string;
  description: string;
  mainProduct: string;
  category: string;
  targetAudience: string;
  businessGoals: string;
  campaign_profile_id?: string | null;
  odontSpecialties: string[];
  targetAgeMin: number;
  targetAgeMax: number;
  specialtyTickets: Record<string, number>;
  strategic_notes?: string;
  whatsappNumber?: string;
}

export const useBusinessSettings = () => {
  const { toast } = useToast();
  const { session, isAuthenticated } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [businessData, setBusinessData] = useState<BusinessData>({
    name: '',
    description: '',
    mainProduct: '',
    category: '',
    targetAudience: '',
    businessGoals: '',
    campaign_profile_id: null,
    odontSpecialties: [],
    targetAgeMin: 18,
    targetAgeMax: 65,
    specialtyTickets: {},
    strategic_notes: '',
    whatsappNumber: '',
  });

  const loadBusinessSettings = async () => {
    if (!isAuthenticated || !session?.user) {
      console.log('User not authenticated, skipping load');
      return;
    }

    setIsLoading(true);
    try {
      console.log('Loading business settings for user:', session.user.id);
      
      const { data, error } = await supabase
        .from('business_settings')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading business settings:', error);
        throw new Error(error.message || 'Erro ao carregar configurações');
      }

      if (data) {
        const loadedData = {
          name: data.business_name || '',
          description: data.business_description || '',
          mainProduct: data.main_product || '',
          category: data.category || '',
          targetAudience: data.target_audience || '',
          businessGoals: data.business_goals || '',
          campaign_profile_id: data.campaign_profile_id || null,
          odontSpecialties: data.odont_specialties || [],
          targetAgeMin: data.target_age_min || 18,
          targetAgeMax: data.target_age_max || 65,
          specialtyTickets: data.specialty_tickets || {},
          strategic_notes: data.strategic_notes || '',
          whatsappNumber: data.whatsapp_number || '',
        };
        
        console.log('Loaded business data:', loadedData);
        setBusinessData(loadedData);
        
        // Save to localStorage only after successful DB load
        localStorage.setItem('camply_business_data', JSON.stringify(loadedData));
      }
    } catch (error) {
      console.error('Failed to load business settings:', error);
      toast({
        title: "Erro ao carregar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveBusinessSettings = async (
    values?: Partial<BusinessData>, 
    opts?: { origin?: 'manual' | 'profile' },
    retryCount: number = 0
  ): Promise<boolean> => {
    const startTime = Date.now();
    
    if (!isAuthenticated || !session?.user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para salvar as configurações.",
        variant: "destructive"
      });
      return false;
    }

    console.log('[useBusinessSettings] 🚀 Save attempt', {
      retryCount,
      userId: session.user.id,
      timestamp: new Date().toISOString()
    });

    setIsSaving(true);
    try {
      const dataToSave = values ? { ...businessData, ...values } : businessData;
      
      console.log('[useBusinessSettings] 💾 Starting UPSERT operation', {
        userId: session.user.id,
        hasData: !!dataToSave,
        timestamp: new Date().toISOString()
      });

      const dbSettings = {
        user_id: session.user.id,
        business_name: dataToSave.name,
        business_description: dataToSave.description,
        main_product: dataToSave.mainProduct,
        category: dataToSave.category,
        target_audience: dataToSave.targetAudience,
        business_goals: dataToSave.businessGoals,
        campaign_profile_id: dataToSave.campaign_profile_id || null, // sanitize '' to null for UUID FK
        odont_specialties: dataToSave.odontSpecialties,
        target_age_min: dataToSave.targetAgeMin,
        target_age_max: dataToSave.targetAgeMax,
        specialty_tickets: dataToSave.specialtyTickets,
        strategic_notes: dataToSave.strategic_notes || null,
        whatsapp_number: dataToSave.whatsappNumber || null,
        updated_at: new Date().toISOString()
      };

      // ✅ Single UPSERT operation with timeout protection
      // When user takes a long time filling the form, the HTTP connection can go stale
      // causing fetch to hang indefinitely. Race with a 15s timeout to prevent spinner lock.
      const upsertPromise = supabase
        .from('business_settings')
        .upsert(dbSettings, {
          onConflict: 'user_id',
          ignoreDuplicates: false
        })
        .select()
        .single();

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('SAVE_TIMEOUT')), 15000)
      );

      const { data, error } = await Promise.race([upsertPromise, timeoutPromise]);

      console.log('[useBusinessSettings] ⏱️ UPSERT completed in:', Date.now() - startTime, 'ms');
      
      if (error) {
        console.error('[useBusinessSettings] ❌ Database error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw new Error(error.message || 'Erro ao salvar configurações');
      }
      
      console.log('[useBusinessSettings] ✅ Save successful!');
      
      // Update local state with saved data
      setBusinessData(dataToSave);
      
      // Save to localStorage after successful DB save
      localStorage.setItem('camply_business_data', JSON.stringify(dataToSave));

      // Only show toast for manual saves
      if (opts?.origin === 'manual') {
        toast({
          title: "Configurações salvas!",
          description: "Suas configurações foram salvas com sucesso.",
        });

        // Auto-generate AI campaign profile (fire-and-forget)
        const hasMinimumData = dataToSave.name || dataToSave.category || dataToSave.mainProduct;
        if (hasMinimumData) {
          console.log('[useBusinessSettings] 🤖 Triggering AI profile generation...');
          supabase.functions.invoke('ai-generate-profile', {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }).then(({ data: profileData, error: profileError }) => {
            if (profileError) {
              console.warn('[useBusinessSettings] AI profile generation failed (non-blocking):', profileError);
            } else if (profileData?.profile_id) {
              console.log('[useBusinessSettings] ✅ AI profile generated:', profileData.profile_id);
              // Update local state with new profile ID
              setBusinessData(prev => ({ ...prev, campaign_profile_id: profileData.profile_id }));
              toast({
                title: "Perfil de campanha IA gerado!",
                description: `Segmentação otimizada automaticamente com ${profileData.interests_resolved || 0} interesses.`,
              });
            }
          }).catch(err => {
            console.warn('[useBusinessSettings] AI profile generation error (non-blocking):', err);
          });
        }
      }

      return true;
    } catch (error: any) {
      console.error('[useBusinessSettings] ❌ Save failed after:', Date.now() - startTime, 'ms', {
        errorType: error instanceof Error ? error.constructor.name : typeof error,
        errorName: error?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        retryCount
      });
      
      // Handle timeout errors with retry
      const isTimeout = error?.name === 'AbortError' || error?.message === 'SAVE_TIMEOUT';
      if (isTimeout && retryCount < 2) {
        console.log('[useBusinessSettings] ⏰ Timeout - retrying...', {
          attempt: retryCount + 2,
          maxRetries: 3
        });

        setIsSaving(false);

        toast({
          title: "Tentando novamente...",
          description: `Conexão lenta detectada. Tentativa ${retryCount + 2} de 3.`,
        });

        await new Promise(resolve => setTimeout(resolve, 1000));
        return saveBusinessSettings(values, opts, retryCount + 1);
      }

      const errorMessage = isTimeout
        ? "A conexão demorou muito tempo. Verifique sua internet e tente novamente."
        : error instanceof Error ? error.message : "Erro desconhecido ao salvar. Tente novamente.";
      
      toast({
        title: "Erro ao salvar",
        description: errorMessage,
        variant: "destructive"
      });
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateBusinessData = (field: keyof BusinessData, value: string | string[] | number | Record<string, number>) => {
    setBusinessData(prev => ({ ...prev, [field]: value }));
  };

  const clearAllBusinessSettings = async (): Promise<boolean> => {
    if (!isAuthenticated || !session?.user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado.",
        variant: "destructive"
      });
      return false;
    }

    // Backup current state for rollback
    const previousData = { ...businessData };

    try {
      const defaultValues: BusinessData = {
        name: '',
        description: '',
        mainProduct: '',
        category: '',
        targetAudience: '',
        businessGoals: '',
        campaign_profile_id: null,
        odontSpecialties: [],
        targetAgeMin: 18,
        targetAgeMax: 65,
        specialtyTickets: {},
        strategic_notes: '',
        whatsappNumber: '',
      };

      console.log('[useBusinessSettings] 🗑️ Clearing all business settings...');
      
      // Reset local state first
      setBusinessData(defaultValues);
      
      const success = await saveBusinessSettings(defaultValues, { origin: 'manual' });
      
      if (success) {
        localStorage.removeItem('selected_specialization');
        localStorage.removeItem('camply_business_data');
        
        toast({
          title: "Dados limpos!",
          description: "Todas as informações foram removidas com sucesso.",
        });
      } else {
        // Rollback on failure
        console.log('[useBusinessSettings] ⚠️ Clear failed, rolling back to previous state');
        setBusinessData(previousData);
      }
      
      return success;
    } catch (error) {
      console.error('[useBusinessSettings] Error clearing business settings:', error);
      // Rollback on error
      setBusinessData(previousData);
      toast({
        title: "Erro ao limpar",
        description: "Ocorreu um erro ao limpar os dados. Tente novamente.",
        variant: "destructive"
      });
      return false;
    }
  };

  // Load settings when authentication state changes
  useEffect(() => {
    if (isAuthenticated && session?.user) {
      loadBusinessSettings();
    }
  }, [isAuthenticated, session?.user?.id]);

  return {
    businessData,
    setBusinessData,
    updateBusinessData,
    loadBusinessSettings,
    saveBusinessSettings,
    clearAllBusinessSettings,
    isLoading,
    isSaving
  };
};