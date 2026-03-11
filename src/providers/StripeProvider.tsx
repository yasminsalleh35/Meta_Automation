import React, { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { usePaymentsConfig } from '@/hooks/usePaymentsConfig';
import { useAuth } from '@/contexts/AuthContext';
import { isAuthRoute } from '@/utils/routerGuards';
import { PagarmeCheckoutProvider } from '@/contexts/PagarmeCheckoutContext';

interface StripeProviderProps {
  children: React.ReactNode;
}

export const StripeProvider: React.FC<StripeProviderProps> = ({ children }) => {
  const { isAuthenticated, loading: authLoading, mustChangePassword } = useAuth();
  const { config, loading: configLoading } = usePaymentsConfig();
  const [stripe, setStripe] = useState<Stripe | null>(null);

  // 🚫 Não montar Stripe em rotas de auth ou durante reset de senha
  if (isAuthRoute() || mustChangePassword) {
    return <div>{children}</div>;
  }

  useEffect(() => {
    // Load Stripe if we have a publishable key from config (works for authenticated and guest users)
    if (config?.stripe?.publishable_key && !configLoading) {
      loadStripe(config.stripe.publishable_key).then((stripeInstance) => {
        setStripe(stripeInstance);
      });
    }
  }, [config?.stripe?.publishable_key, configLoading]);

  // If auth is still loading or Stripe config is loading, render without Stripe context
  if (authLoading || (configLoading || (config?.stripe?.publishable_key && !stripe))) {
    return <div>{children}</div>;
  }

  // If no publishable key available, render without Stripe context
  if (!config?.stripe?.publishable_key) {
    return <div>{children}</div>;
  }

  // Configure Elements with Custom Payment Methods if Pagar.me is configured
  const elementsOptions: any = {};
  
  if (config?.pagarme?.stripe_custom_payment_method_id) {
    elementsOptions.customPaymentMethods = [{
      id: config.pagarme.stripe_custom_payment_method_id,
      options: {
        type: 'static',
        subtitle: `Cartão em até ${config.pagarme.installments_max}x (Pagar.me)`
      }
    }];
  }

  return (
    <PagarmeCheckoutProvider>
      <Elements stripe={stripe} options={elementsOptions}>
        {children}
      </Elements>
    </PagarmeCheckoutProvider>
  );
};