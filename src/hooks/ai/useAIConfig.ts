
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useAIConfig = () => {
  const { toast } = useToast();

  const checkAIConfig = async () => {
    try {
      // Verificar status via função pública que não expõe API keys
      const { data, error } = await supabase.rpc('get_ai_status');
      
      if (error) {
        console.error('Erro ao verificar configuração da IA:', error);
        return { isValid: false, message: 'Erro ao verificar configuração da IA' };
      }

      const status = data?.[0];
      console.log('Status da IA verificado:', status);
      
      if (!status || !status.is_available) {
        return { 
          isValid: false, 
          message: 'IA não configurada pelo administrador' 
        };
      }
      
      return { 
        isValid: true, 
        config: {
          provider: status.provider,
          model: status.model_name,
          enabled: true
        }
      };
    } catch (error) {
      console.error('Erro ao verificar configuração:', error);
      return { isValid: false, message: 'Erro na configuração da IA' };
    }
  };

  const showConfigError = (message: string) => {
    toast({
      title: message,
      description: "Entre em contato com o administrador para configurar a integração de IA.",
      variant: "destructive"
    });
  };

  return {
    checkAIConfig,
    showConfigError
  };
};
