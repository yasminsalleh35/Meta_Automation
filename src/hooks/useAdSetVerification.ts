
import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

interface AdSetExpectedSettings {
  ad_account_id: string;
  campaign_id: string;
  ad_set_id?: string;
  expected_name: string;
  expected_locality_json: any;
  expected_budget_amount: number;
  expected_budget_type: 'daily_budget' | 'lifetime_budget';
  expected_instagram_profile_id?: string;
}

interface VerificationResult {
  success: boolean;
  verification_status: string;
  corrections_applied: string[];
  error?: string;
}

export const useAdSetVerification = () => {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const saveExpectedSettings = async (settings: AdSetExpectedSettings) => {
    console.log('💾 Saving expected Ad Set settings:', settings);
    
    try {
      const { data, error } = await supabase
        .from('expected_ad_set_settings')
        .insert(settings)
        .select()
        .single();

      if (error) {
        console.error('Error saving expected settings:', error);
        throw error;
      }

      console.log('✅ Expected settings saved:', data);
      return data;
    } catch (error) {
      console.error('Failed to save expected settings:', error);
      toast({
        title: "Erro ao salvar configurações",
        description: "Não foi possível salvar as configurações esperadas do Ad Set",
        variant: "destructive"
      });
      throw error;
    }
  };

  const updateAdSetId = async (settingsId: string, adSetId: string) => {
    console.log(`🔄 Updating Ad Set ID: ${settingsId} -> ${adSetId}`);
    
    try {
      const { error } = await supabase
        .from('expected_ad_set_settings')
        .update({ ad_set_id: adSetId })
        .eq('id', settingsId);

      if (error) {
        console.error('Error updating Ad Set ID:', error);
        throw error;
      }

      console.log('✅ Ad Set ID updated successfully');
    } catch (error) {
      console.error('Failed to update Ad Set ID:', error);
      throw error;
    }
  };

  const verifyAndCorrectAdSet = async (adSetId: string, adAccountId?: string): Promise<VerificationResult> => {
    console.log(`🔍 Starting verification for Ad Set: ${adSetId}`);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('verify-and-correct-ad-set', {
        body: { ad_set_id: adSetId, ad_account_id: adAccountId }
      });

      if (error) {
        console.error('Verification function error:', error);
        throw error;
      }

      console.log('✅ Verification completed:', data);

      // Show toast based on result
      if (data.verification_status === 'VERIFIED_OK') {
        toast({
          title: "Verificação concluída",
          description: "Ad Set está conforme as configurações esperadas",
          variant: "default"
        });
      } else if (data.verification_status === 'CORRECTED') {
        toast({
          title: "Correções aplicadas",
          description: `Campos corrigidos: ${data.corrections_applied.join(', ')}`,
          variant: "default"
        });
      }

      return data;
    } catch (error) {
      console.error('Verification failed:', error);
      
      toast({
        title: "Erro na verificação",
        description: "Não foi possível verificar/corrigir o Ad Set",
        variant: "destructive"
      });

      return {
        success: false,
        verification_status: 'ERROR',
        corrections_applied: [],
        error: error.message
      };
    } finally {
      setIsLoading(false);
    }
  };

  const getPendingVerifications = async () => {
    try {
      const { data, error } = await supabase
        .from('expected_ad_set_settings')
        .select('*')
        .eq('is_pending_verification', true)
        .not('ad_set_id', 'is', null);

      if (error) {
        console.error('Error fetching pending verifications:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Failed to get pending verifications:', error);
      return [];
    }
  };

  return {
    saveExpectedSettings,
    updateAdSetId,
    verifyAndCorrectAdSet,
    getPendingVerifications,
    isLoading
  };
};
