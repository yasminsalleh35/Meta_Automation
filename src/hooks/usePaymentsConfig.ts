// =============================================
// Hook unificado para gerenciar Stripe + Pagar.me
// Substitui/estende useStripeConfig para suporte híbrido
// =============================================

import { useStripeConfig } from './useStripeConfig';
import { usePagarmeConfig } from './usePagarmeConfig';
import { PaymentsConfig } from '@/types/payments';

export const usePaymentsConfig = () => {
  const {
    config: stripeConfig,
    loading: stripeLoading,
    saving: stripeSaving,
    updateConfig: updateStripeConfig,
    refetch: refetchStripe
  } = useStripeConfig();

  const {
    config: pagarmeConfig,
    loading: pagarmeLoading,
    saving: pagarmeSaving,
    testing: pagarmeTesting,
    upsertConfig: upsertPagarmeConfig,
    testConnection: testPagarmeConnection,
    refetch: refetchPagarme,
    isConfigured: isPagarmeConfigured,
    hasCustomPaymentMethod
  } = usePagarmeConfig();

  // Estados combinados
  const loading = stripeLoading || pagarmeLoading;
  const saving = stripeSaving || pagarmeSaving;

  // Configuração unificada
  const config: PaymentsConfig = {
    stripe: stripeConfig,
    pagarme: pagarmeConfig
  };

  // 🎯 FASE 3: Status de configuração - Stripe é opcional (descontinuado para usuários comuns)
  const isStripeConfigured = stripeConfig 
    ? (stripeConfig.publishable_key && stripeConfig.has_webhook_secret)
    : false; // null = não configurado, mas NÃO é erro
  
  // 🎯 FASE 3: Hybrid mode depende APENAS de Pagar.me (Stripe descontinuado)
  const isHybridReady = isPagarmeConfigured && hasCustomPaymentMethod;

  // Métodos unificados
  const refetchAll = async () => {
    await Promise.all([refetchStripe(), refetchPagarme()]);
  };

  return {
    // Configurações
    config,
    stripeConfig,
    pagarmeConfig,
    
    // Estados
    loading,
    saving,
    testing: pagarmeTesting,
    
    // Status
    isStripeConfigured,
    isPagarmeConfigured,
    isHybridReady,
    hasCustomPaymentMethod,
    
    // Métodos Stripe (mantém compatibilidade)
    updateStripeConfig,
    
    // Métodos Pagar.me
    upsertPagarmeConfig,
    testPagarmeConnection,
    
    // Métodos unificados
    refetchAll,
    refetchStripe,
    refetchPagarme
  };
};