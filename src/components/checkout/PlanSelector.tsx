// =============================================
// Seletor de planos para checkout Pagar.me
// =============================================

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  features: string[];
  popular?: boolean;
}

interface PlanSelectorProps {
  onPlanSelect: (plan: {
    id: string;
    name: string;
    price: number;
    billingPeriod: 'monthly' | 'annual';
  }) => void;
}

const PlanSelector: React.FC<PlanSelectorProps> = ({ onPlanSelect }) => {
  // Planos fixos (idealmente viriam da API)
  const plans: Plan[] = [
    {
      id: 'premium',
      name: 'Camply Premium',
      description: 'Acesso completo à plataforma Camply',
      price_monthly: 349.99,
      price_annual: 2499.00,
      features: [
        'Campanhas ilimitadas',
        'Análise avançada de performance',
        'Suporte prioritário',
        'Integração com Meta Ads',
        'Relatórios personalizados',
        'API personalizada'
      ],
      popular: true
    }
  ];

  const handlePlanSelection = (plan: Plan, billingPeriod: 'monthly' | 'annual') => {
    const price = billingPeriod === 'annual' ? plan.price_annual : plan.price_monthly;
    
    onPlanSelect({
      id: plan.id,
      name: plan.name,
      price,
      billingPeriod
    });
  };

  return (
    <div className="space-y-6">
      {plans.map(plan => (
        <Card key={plan.id} className={`relative ${plan.popular ? 'border-blue-500 shadow-lg' : ''}`}>
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-blue-500 text-white px-4 py-1 flex items-center space-x-1">
                <Star className="w-3 h-3" />
                <span>Mais Popular</span>
              </Badge>
            </div>
          )}
          
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
            <p className="text-gray-600">{plan.description}</p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Preços */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Plano Mensal */}
              <div className="text-center p-4 border rounded-lg">
                <div className="mb-2">
                  <span className="text-3xl font-bold">R$ {plan.price_monthly.toFixed(2).replace('.', ',')}</span>
                  <span className="text-gray-600">/mês</span>
                </div>
                <Button 
                  onClick={() => handlePlanSelection(plan, 'monthly')}
                  className="w-full"
                  variant="outline"
                >
                  Escolher Mensal
                </Button>
              </div>
              
              {/* Plano Anual */}
              <div className="text-center p-4 border rounded-lg bg-blue-50 border-blue-200">
                <div className="mb-2">
                  <span className="text-3xl font-bold text-blue-600">R$ {plan.price_annual.toFixed(2).replace('.', ',')}</span>
                  <span className="text-gray-600">/ano</span>
                </div>
                <div className="text-sm text-blue-600 mb-2">
                  12x R$ {(plan.price_annual / 12).toFixed(2).replace('.', ',')} sem juros
                </div>
                <div className="text-xs text-green-600 mb-3">
                  Economia de R$ {((plan.price_monthly * 12) - plan.price_annual).toFixed(2).replace('.', ',')}
                </div>
                <Button 
                  onClick={() => handlePlanSelection(plan, 'annual')}
                  className="w-full"
                >
                  Escolher Anual
                </Button>
              </div>
            </div>
            
            {/* Features */}
            <div>
              <h4 className="font-semibold mb-3">O que está incluso:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default PlanSelector;