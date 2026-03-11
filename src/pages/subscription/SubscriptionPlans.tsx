import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const plans = [
  {
    code: 'mensal',
    name: 'Mensal',
    price: 349.99,
    installments: 1,
    period: '/mês',
    features: [
      'Gerenciamento ilimitado de campanhas',
      'Análise de desempenho em tempo real',
      'Suporte prioritário',
      'Integração com Meta Ads',
      'Relatórios personalizados',
      'WhatsApp Business integrado'
    ]
  },
  {
    code: 'anual',
    name: 'Anual',
    price: 2499.99,
    installments: 12,
    period: '/ano',
    discount: 'Economia de R$ 699,89',
    features: [
      'Tudo do plano mensal',
      '2 meses grátis',
      'Parcelamento em 12x sem juros',
      'Suporte VIP dedicado',
      'Consultoria estratégica mensal',
      'Relatórios avançados com IA'
    ],
    popular: true
  }
];

export default function SubscriptionPlans() {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'anual' | null>(null);

  const handleSelectPlan = (planCode: 'mensal' | 'anual') => {
    setSelectedPlan(planCode);
    // Navigate to checkout with plan info
    navigate(`/assinatura/checkout?plan=${planCode}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Escolha seu Plano</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Gerencie suas campanhas com facilidade e maximize seus resultados
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <Card
              key={plan.code}
              className={`relative p-8 ${
                plan.popular
                  ? 'border-2 border-primary shadow-xl'
                  : 'border border-border'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-semibold">
                  Mais Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold">
                    R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                {plan.discount && (
                  <p className="text-sm text-green-600 mt-2 font-semibold">{plan.discount}</p>
                )}
                {plan.installments > 1 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    ou {plan.installments}x de R${' '}
                    {(plan.price / plan.installments).toLocaleString('pt-BR', {
                      minimumFractionDigits: 2
                    })}{' '}
                    sem juros
                  </p>
                )}
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                onClick={() => handleSelectPlan(plan.code as 'mensal' | 'anual')}
                className="w-full"
                size="lg"
                variant={plan.popular ? 'default' : 'outline'}
              >
                Escolher {plan.name}
              </Button>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            Pagamento 100% seguro através da Pagar.me • Cancele a qualquer momento
          </p>
        </div>
      </div>
    </div>
  );
}
