
import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

export const useEmailConfirmation = () => {
  const [isResending, setIsResending] = useState(false);
  const supabase = useSupabase();
  const { toast } = useToast();

  const resendConfirmationEmail = async (email: string) => {
    if (!email) {
      toast({
        title: "Erro",
        description: "Email é obrigatório para reenvio.",
        variant: "destructive"
      });
      return false;
    }

    setIsResending(true);
    
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/email-confirmation`
        }
      });

      if (error) {
        console.error('Erro ao reenviar email:', error);
        
        let errorMessage = "Não foi possível reenviar o email. Tente novamente.";
        
        if (error.message.includes('rate limit')) {
          errorMessage = "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.";
        } else if (error.message.includes('not found')) {
          errorMessage = "Email não encontrado. Verifique se o email está correto.";
        }
        
        toast({
          title: "Erro ao reenviar",
          description: errorMessage,
          variant: "destructive"
        });
        return false;
      }

      toast({
        title: "Email reenviado!",
        description: "Verifique sua caixa de entrada para o novo link de confirmação.",
      });
      
      return true;
    } catch (error) {
      console.error('Erro inesperado ao reenviar email:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado. Tente novamente.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsResending(false);
    }
  };

  return {
    resendConfirmationEmail,
    isResending
  };
};
