
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { usePaymentsConfig } from '@/hooks/usePaymentsConfig';

const plans = [
  {
    type: 'premium' as const,
    billingPeriod: 'monthly' as const,
    name: 'Mensal',
    price: 'R$ 349,99',
    period: '/mês',
    description: 'Acesso completo mensal',
    icon: Crown,
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
    popular: false,
    color: 'border-primary'
  },
  {
    type: 'premium' as const,
    billingPeriod: 'annual' as const,
    name: 'Anual',
    price: 'R$ 2.499,00',
    period: '/ano',
    originalPrice: 'R$ 4.199,88',
    description: 'Melhor custo-benefício',
    icon: Star,
    features: [
      'Campanhas ilimitadas',
      'Orçamento ilimitado',
      'IA ilimitada',
      'Análises avançadas de campanha',
      'Gerenciamento completo de leads',
      'Integração com Meta Ads',
      'Relatórios estratégicos',
      'Suporte prioritário',
      'API personalizada',
      '12x R$ 208,25 sem juros',
      'Economia de R$ 1.700/ano'
    ],
    popular: true,
    color: 'border-primary'
  }
];

export const SubscriptionPlans: React.FC = () => {
  const { subscription, isCheckingOut, createCheckoutSession } = useSubscription();
  const { isHybridReady } = usePaymentsConfig();

  // Hide plans if user is admin
  if (subscription?.subscription_tier === 'admin' || subscription?.is_admin) {
    return (
      <div className="text-center p-8 border border-dashed border-gray-300 rounded-lg">
        <p className="text-muted-foreground">
          Como administrador, você já possui acesso completo à plataforma.
        </p>
      </div>
    );
  }

  const isCurrentPlan = (planType: string, billingPeriod: string) => {
    return subscription?.subscription_tier === planType && subscription?.subscribed;
  };

  const handleSelectPlan = (planType: 'premium', billingPeriod: 'monthly' | 'annual') => {
    createCheckoutSession(planType, billingPeriod);
  };

  const handleParceladoClick = (planType: 'premium', billingPeriod: 'monthly' | 'annual') => {
    const amount = billingPeriod === 'annual' ? 249900 : 34999; // centavos
    const url = `/checkout/parcelado?amount=${amount}&currency=BRL&ref=dashboard_${billingPeriod}`;
    window.location.href = url;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
      {plans.map((plan) => {
        const Icon = plan.icon;
        const isCurrent = isCurrentPlan(plan.type, plan.billingPeriod);
        
        return (
          <Card 
            key={`${plan.type}-${plan.billingPeriod}`} 
            className={`relative ${plan.color} ${plan.popular ? 'ring-2 ring-primary shadow-lg' : ''} hover:shadow-md transition-shadow`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground">Mais Popular</Badge>
              </div>
            )}
            
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Icon className={`w-12 h-12 ${plan.popular ? 'text-primary' : 'text-muted-foreground'}`} />
              </div>
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="flex flex-col items-center mt-4">
                <div className="flex items-center">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground ml-1">{plan.period}</span>
                </div>
                {plan.originalPrice && (
                  <div className="flex items-center mt-2">
                    <span className="text-sm text-muted-foreground line-through">{plan.originalPrice}</span>
                    <Badge variant="secondary" className="ml-2 text-xs">40% OFF</Badge>
                  </div>
                )}
              </div>
            </CardHeader>
            
            <CardContent>
              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start">
                    <Check className="w-4 h-4 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <div className="space-y-3">
                <Button 
                  className="w-full" 
                  variant={isCurrent ? "outline" : plan.popular ? "default" : "outline"}
                  disabled={isCurrent || isCheckingOut}
                  onClick={() => handleSelectPlan(plan.type, plan.billingPeriod)}
                >
                  {isCurrent ? 'Plano Atual' : isCheckingOut ? 'Processando...' : 'Assinar Plano'}
                </Button>
                
                {!isCurrent && isHybridReady && (
                  <Button 
                    variant="ghost"
                    size="sm"
                    className="w-full text-sm text-muted-foreground hover:text-primary"
                    disabled={isCheckingOut}
                    onClick={() => handleParceladoClick(plan.type, plan.billingPeriod)}
                  >
                    💳 Pagar parcelado até 12x
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
