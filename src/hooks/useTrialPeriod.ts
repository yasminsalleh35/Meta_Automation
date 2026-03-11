import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface TrialStatus {
  isActive: boolean;
  isExpired: boolean;
  daysRemaining: number;
  expiresAt: Date | null;
  hasSubscription: boolean;
  loading: boolean;
}

export const useTrialPeriod = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { role, isAdmin } = useUserRole();
  const [trialStatus, setTrialStatus] = useState<TrialStatus>({
    isActive: false,
    isExpired: false,
    daysRemaining: 0,
    expiresAt: null,
    hasSubscription: false,
    loading: true
  });

  const checkTrialStatus = async () => {
    if (!user) {
      setTrialStatus(prev => ({ ...prev, loading: false }));
      return;
    }

    // Admin and super_admin users have premium access automatically
    if (role === 'admin' || role === 'super_admin') {
      setTrialStatus({
        isActive: false,
        isExpired: false,
        daysRemaining: 0,
        expiresAt: null,
        hasSubscription: true, // Treat as having subscription
        loading: false
      });
      return;
    }

    try {
      // ✅ FASE 1.1: Check active subscription from subscribers table (unified source)
      const { data: subscriberData, error: subscriberError } = await supabase
        .from('subscribers')
        .select('is_active, subscription_status, plan_type')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      const hasActiveSubscription = !subscriberError && subscriberData?.is_active === true;

      // 🔍 STEP 2: Check Stripe subscription (LEGACY - only for admins/old users)
      const { data: stripeData, error: stripeError } = await supabase.functions.invoke('check-subscription');
      
      if (stripeError) {
        console.warn('Stripe check failed (expected for Pagar.me users):', stripeError);
      }

      const hasStripeSub = stripeData?.subscribed && stripeData?.subscription_tier;

      // 🎯 COMBINE: Has subscription if has Subscriber record OR Stripe (backwards compatibility)
      const hasCombinedSubscription = hasActiveSubscription || hasStripeSub;

      // Calculate trial only if NO subscription
      const userCreatedAt = new Date(user.created_at);
      const trialExpiresAt = new Date(userCreatedAt.getTime() + (14 * 24 * 60 * 60 * 1000));
      const now = new Date();
      
      const diffTime = trialExpiresAt.getTime() - now.getTime();
      const daysRemaining = Math.floor(diffTime / (24 * 60 * 60 * 1000));

      const isTrialActive = !hasCombinedSubscription && daysRemaining > 0;
      const isTrialExpired = !hasCombinedSubscription && daysRemaining <= 0;

      setTrialStatus({
        isActive: isTrialActive,
        isExpired: isTrialExpired,
        daysRemaining: Math.max(0, daysRemaining),
        expiresAt: trialExpiresAt,
        hasSubscription: hasCombinedSubscription,
        loading: false
      });

      // 🚫 NOTIFICAÇÕES DE TRIAL DESATIVADAS
      // Não exibir toasts sobre expiração de trial
      /* CÓDIGO ORIGINAL COMENTADO
      if (isTrialActive && daysRemaining <= 3 && daysRemaining > 0) {
        toast({
          title: `⏰ Seu trial expira em ${daysRemaining} dia${daysRemaining > 1 ? 's' : ''}`,
          description: "Assine agora para continuar aproveitando todos os recursos premium.",
          duration: 10000,
        });
      }
      */

    } catch (error) {
      console.error('Error in checkTrialStatus:', error);
      setTrialStatus(prev => ({ ...prev, loading: false }));
    }
  };

  const startTrial = async () => {
    try {
      // Trial is automatically started when user creates account
      // Just update local state to reflect trial start
      await checkTrialStatus();
      
      toast({
        title: "🎉 Trial iniciado com sucesso!",
        description: "Você tem 14 dias para testar todos os recursos premium.",
      });

      return true;
    } catch (error) {
      console.error('Error starting trial:', error);
      toast({
        title: "Erro ao iniciar trial",
        description: "Tente novamente ou entre em contato com o suporte.",
        variant: "destructive"
      });
      return false;
    }
  };

  const extendTrial = async (days: number = 7) => {
    try {
      // This would typically require admin privileges or special business logic
      toast({
        title: "Entre em contato com o suporte",
        description: "Para extensão do trial, entre em contato via WhatsApp.",
      });
      return false;
    } catch (error) {
      console.error('Error extending trial:', error);
      return false;
    }
  };

  useEffect(() => {
    checkTrialStatus();
  }, [user]);

  return {
    trialStatus,
    startTrial,
    extendTrial,
    refreshTrialStatus: checkTrialStatus
  };
};