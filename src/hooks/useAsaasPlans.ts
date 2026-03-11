import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { useUserRole } from '@/hooks/useUserRole';
import { AsaasPlan, AsaasEnvironment } from '@/types/asaas';

export const useAsaasPlans = (environment: AsaasEnvironment = 'sandbox') => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { isAdmin } = useUserRole();
  
  const [plans, setPlans] = useState<AsaasPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('asaas_plans')
        .select('*')
        .eq('environment', environment)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPlans(data || []);

    } catch (error: any) {
      console.error('Error fetching Asaas plans:', error);
      if (isAdmin) {
        toast({
          title: "Erro ao carregar planos",
          description: error.message,
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const createPlan = async (plan: Omit<AsaasPlan, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem criar planos.",
        variant: "destructive"
      });
      return false;
    }

    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('asaas_plans')
        .insert([{ ...plan, environment }]);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano criado com sucesso.",
      });

      await fetchPlans();
      return true;

    } catch (error: any) {
      console.error('Error creating Asaas plan:', error);
      toast({
        title: "Erro ao criar plano",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const updatePlan = async (id: string, updates: Partial<AsaasPlan>) => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem atualizar planos.",
        variant: "destructive"
      });
      return false;
    }

    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('asaas_plans')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano atualizado com sucesso.",
      });

      await fetchPlans();
      return true;

    } catch (error: any) {
      console.error('Error updating Asaas plan:', error);
      toast({
        title: "Erro ao atualizar plano",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const deletePlan = async (id: string) => {
    if (!isAdmin) {
      toast({
        title: "Acesso negado",
        description: "Apenas administradores podem deletar planos.",
        variant: "destructive"
      });
      return false;
    }

    setSaving(true);
    
    try {
      const { error } = await supabase
        .from('asaas_plans')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "Plano deletado com sucesso.",
      });

      await fetchPlans();
      return true;

    } catch (error: any) {
      console.error('Error deleting Asaas plan:', error);
      toast({
        title: "Erro ao deletar plano",
        description: error.message,
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [environment]);

  return {
    plans,
    loading,
    saving,
    fetchPlans,
    createPlan,
    updatePlan,
    deletePlan
  };
};
