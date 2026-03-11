import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';

interface SubscriptionPlan {
  id: string;
  plan_type: string;
  name: string;
  description: string | null;
  price_monthly: number | null;
  price_annual: number | null;
  stripe_price_id_monthly: string | null;
  stripe_price_id_annual: string | null;
  limits: Record<string, any>;
  features: string[] | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface PriceIds {
  premium_monthly: string;
  premium_annual: string;
}

export const useSubscriptionPlans = () => {
  const { toast } = useToast();
  const supabase = useSupabase();
  
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchPlans = async () => {
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .order('plan_type');

      if (error) {
        console.error('Error fetching subscription plans:', error);
        toast({
          title: "Erro ao carregar planos",
          description: "Não foi possível carregar os planos de assinatura.",
          variant: "destructive"
        });
        return;
      }

      setPlans(data || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado ao carregar os planos.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePriceIds = async (priceIds: PriceIds) => {
    setSaving(true);
    try {
      // Check if premium plan exists
      const premiumPlan = plans.find(plan => plan.plan_type === 'premium');
      
      if (premiumPlan) {
        // Update existing plan
        const { error } = await supabase
          .from('subscription_plans')
          .update({
            stripe_price_id_monthly: priceIds.premium_monthly,
            stripe_price_id_annual: priceIds.premium_annual,
            updated_at: new Date().toISOString()
          })
          .eq('id', premiumPlan.id);

        if (error) {
          console.error('Error updating subscription plan:', error);
          toast({
            title: "Erro ao salvar Price IDs",
            description: "Não foi possível salvar os Price IDs do Stripe.",
            variant: "destructive"
          });
          return false;
        }
      } else {
        // Create new premium plan
        const { error } = await supabase
          .from('subscription_plans')
          .insert({
            plan_type: 'premium',
            name: 'Camply Premium',
            description: 'Acesso completo à plataforma Camply',
            price_monthly: 349.99,
            price_annual: 2499.00,
            stripe_price_id_monthly: priceIds.premium_monthly,
            stripe_price_id_annual: priceIds.premium_annual,
            limits: {
              campaigns: -1,
              monthlyBudget: -1,
              aiSuggestions: -1,
              campaignAnalysis: -1
            },
            features: [
              'Campanhas ilimitadas',
              'Orçamento ilimitado', 
              'IA ilimitada',
              'Análises avançadas de campanha',
              'Gerenciamento completo de leads',
              'Integração com Meta Ads',
              'Relatórios estratégicos',
              'Suporte prioritário',
              'API personalizada'
            ],
            is_active: true
          });

        if (error) {
          console.error('Error creating subscription plan:', error);
          toast({
            title: "Erro ao criar plano",
            description: "Não foi possível criar o plano de assinatura.",
            variant: "destructive"
          });
          return false;
        }
      }

      toast({
        title: "Price IDs salvos!",
        description: "Os Price IDs do Stripe foram salvos com sucesso.",
      });

      // Refresh plans
      await fetchPlans();
      return true;
    } catch (error) {
      console.error('Error updating price IDs:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro inesperado ao salvar os Price IDs.",
        variant: "destructive"
      });
      return false;
    } finally {
      setSaving(false);
    }
  };

  const getPriceIds = (): PriceIds => {
    const premiumPlan = plans.find(plan => plan.plan_type === 'premium');
    return {
      premium_monthly: premiumPlan?.stripe_price_id_monthly || '',
      premium_annual: premiumPlan?.stripe_price_id_annual || ''
    };
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  return {
    plans,
    loading,
    saving,
    updatePriceIds,
    getPriceIds,
    refetch: fetchPlans
  };
};