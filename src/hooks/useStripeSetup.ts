
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';

interface StripeSetup {
  isConfigured: boolean;
  testMode: boolean;
  hasWebhook: boolean;
}

export const useStripeSetup = () => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const [setup, setSetup] = useState<StripeSetup>({
    isConfigured: false,
    testMode: true,
    hasWebhook: false
  });
  const [loading, setLoading] = useState(true);

  const checkStripeSetup = async () => {
    try {
      // Check if Stripe is properly configured by testing the check-subscription function
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        console.log('Stripe setup check:', error);
        setSetup({
          isConfigured: false,
          testMode: true,
          hasWebhook: false
        });
      } else {
        setSetup({
          isConfigured: true,
          testMode: true, // You can determine this from the key format
          hasWebhook: true
        });
      }
    } catch (error) {
      console.error('Error checking Stripe setup:', error);
      setSetup({
        isConfigured: false,
        testMode: true,
        hasWebhook: false
      });
    } finally {
      setLoading(false);
    }
  };

  const testStripeConnection = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      
      if (error) {
        toast({
          title: "Erro na conexão",
          description: "Não foi possível conectar com o Stripe. Verifique suas configurações.",
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Conexão bem-sucedida!",
        description: "O Stripe está configurado corretamente.",
      });
      return true;
    } catch (error) {
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao testar a conexão.",
        variant: "destructive"
      });
      return false;
    }
  };

  useEffect(() => {
    checkStripeSetup();
  }, []);

  return {
    setup,
    loading,
    checkStripeSetup,
    testStripeConnection
  };
};
