
import { useState } from 'react';
import { useSupabase } from '@/hooks/useSupabase';
import { useToast } from '@/hooks/use-toast';

export const useCustomerPortal = () => {
  const [loading, setLoading] = useState(false);
  const supabase = useSupabase();
  const { toast } = useToast();

  const openCustomerPortal = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para acessar o portal.",
          variant: "destructive"
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('pagarme-customer-portal', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error creating portal session:', error);
        toast({
          title: "Erro",
          description: "Não foi possível abrir o portal de gerenciamento.",
          variant: "destructive"
        });
        return;
      }

      if (data?.url) {
        // Abrir portal em nova aba
        window.open(data.url, '_blank');
        toast({
          title: "Portal aberto",
          description: "Portal de gerenciamento aberto em nova aba.",
        });
      } else {
        toast({
          title: "Erro",
          description: "URL do portal não encontrada.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error opening customer portal:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao tentar abrir o portal.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    openCustomerPortal,
    loading
  };
};
