
import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

export const useAutoVerificationCron = () => {
  const supabase = useSupabase();
  const { toast } = useToast();
  const [isRunning, setIsRunning] = useState(false);

  const runAutoVerification = async () => {
    console.log('🚀 Starting manual auto-verification...');
    setIsRunning(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('auto-verify-ad-sets');
      
      if (error) {
        console.error('Auto-verification error:', error);
        throw error;
      }
      
      const summary = data?.summary;
      console.log('📊 Auto-verification completed:', summary);
      
      if (summary?.processed > 0) {
        toast({
          title: "Verificação automática concluída",
          description: `Processados: ${summary.processed}, Sucessos: ${summary.successful}, Erros: ${summary.errors}`,
        });
      } else {
        toast({
          title: "Nenhuma verificação pendente",
          description: "Todos os Ad Sets estão atualizados.",
        });
      }
      
      return data;
    } catch (error) {
      console.error('Failed to run auto-verification:', error);
      
      toast({
        title: "Erro na verificação automática",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      
      throw error;
    } finally {
      setIsRunning(false);
    }
  };

  const showCronSetupInstructions = () => {
    toast({
      title: "Configuração do Cron Job",
      description: "Para configurar a execução automática, acesse o SQL Editor do Supabase e execute o comando fornecido na documentação.",
    });
  };

  return {
    runAutoVerification,
    showCronSetupInstructions,
    isRunning
  };
};
