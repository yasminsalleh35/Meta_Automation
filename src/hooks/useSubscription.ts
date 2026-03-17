
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SubscriptionData {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
  plan_name?: string;
  plan_features?: string[];
  plan_limits?: any;
  is_admin?: boolean;
  provider?: string;
  // Phase 5: Extended status info
  status?: string;
  is_past_due?: boolean;
  grace_period_ends_at?: string | null;
}

export const useSubscription = () => {
  const { toast } = useToast();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const checkSubscription = async () => {
    setIsLoading(true);
    try {
      console.log('📋 Checking subscription status...');
      
      // Try Pagar.me first (V5)
      const { data, error } = await supabase.functions.invoke('check-pagarme-subscription');
      
      if (error) {
        console.error('❌ Error checking Pagar.me subscription:', error);
        throw error;
      }

      console.log('✅ Subscription check result:', data);
      setSubscription(data);
      
      return data;
    } catch (error) {
      console.error('❌ Error in checkSubscription:', error);
      toast({
        title: "Erro ao verificar assinatura",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // ⚠️ DEPRECATED: Esta função está obsoleta
  // ✅ Use usePagarmeCheckout.startPagarmeParcelado para V5
  const createCheckoutSession = async (planType: 'premium', billingPeriod: 'monthly' | 'annual' = 'monthly') => {
    console.warn('⚠️ useSubscription.createCheckoutSession is deprecated. Redirecting to /checkout...');
    
    // Redirecionar para a página de checkout V5
    const plan = billingPeriod === 'annual' ? 'anual' : 'mensal';
    window.location.href = `/checkout?plan=${plan}`;
  };

  const openCustomerPortal = async () => {
    try {
      console.log('🏢 Opening customer portal...');
      
      const { data, error } = await supabase.functions.invoke('pagarme-customer-portal');
      
      if (error) {
        console.error('❌ Error opening portal:', error);
        throw error;
      }

      if (data?.url) {
        console.log('✅ Redirecting to portal:', data.url);
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL received');
      }
    } catch (error) {
      console.error('❌ Error in openCustomerPortal:', error);
      toast({
        title: "Erro ao abrir portal",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    }
  };

  // Phase 5: Trigger subscription sync with provider
  const syncSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.functions.invoke('subscription-sync', {
        body: { mode: 'sync_user', user_id: user.id }
      });

      if (error) {
        console.error('Sync failed:', error);
      } else {
        // Refresh subscription data after sync
        await checkSubscription();
      }
    } catch (error) {
      console.error('Error syncing subscription:', error);
    }
  };

  // Auto-check subscription on mount
  useEffect(() => {
    checkSubscription();
  }, []);

  return {
    subscription,
    isLoading,
    isCheckingOut,
    checkSubscription,
    createCheckoutSession,
    openCustomerPortal,
    syncSubscription,
  };
};
