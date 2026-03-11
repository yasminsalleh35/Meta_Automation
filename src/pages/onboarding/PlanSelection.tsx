import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { CheckCircle, ArrowRight, Crown, Zap } from 'lucide-react';

const PlanSelection: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = useState(true);

  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const plan = {
    name: "Camply Premium",
    description: "Tudo que você precisa para dominar o marketing digital",
    monthlyPrice: 349.99,
    annualPrice: 2499.99,
    monthlyPriceAnnual: 208.25,
    savings: 1699.91,
    features: [
      "Campanhas ilimitadas no Meta Ads",
      "IA avançada para otimização automática", 
      "Análises detalhadas e relatórios",
      "Suporte prioritário via WhatsApp",
      "Templates profissionais de campanhas",
      "Integração completa com Meta Business",
      "Acompanhamento de ROI em tempo real",
      "Treinamentos exclusivos"
    ]
  };

  const handleSubscribe = async () => {
    // Redirecionar para /checkout com o plano correto
    const plan = isAnnual ? 'anual' : 'mensal';
    window.location.href = `/checkout?plan=${plan}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camply-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-camply-blue via-blue-500 to-camply-green flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8 text-white">
          <h1 className="text-4xl font-bold mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl opacity-90">
            Acelere seu crescimento no marketing digital
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-8">
          <span className={`text-white ${!isAnnual ? 'font-semibold' : 'opacity-70'}`}>
            Mensal
          </span>
          <Switch
            checked={isAnnual}
            onCheckedChange={setIsAnnual}
            className="data-[state=checked]:bg-camply-yellow"
          />
          <span className={`text-white ${isAnnual ? 'font-semibold' : 'opacity-70'}`}>
            Anual
          </span>
          {isAnnual && (
            <Badge className="bg-camply-yellow text-camply-blue font-semibold">
              Economize 40%
            </Badge>
          )}
        </div>

        {/* Plan Card */}
        <Card className="bg-white/95 backdrop-blur-xl border-0 shadow-2xl relative overflow-hidden">
          {/* Popular Badge */}
          <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <Badge className="bg-gradient-to-r from-camply-yellow to-camply-green text-camply-blue font-bold px-4 py-1">
              <Crown className="w-4 h-4 mr-1" />
              MAIS POPULAR
            </Badge>
          </div>

          <CardContent className="p-8 pt-12">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center mb-4">
                <div className="w-16 h-16 bg-gradient-to-r from-camply-blue to-camply-green rounded-2xl flex items-center justify-center">
                  <Zap className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
              <p className="text-gray-600 mb-6">{plan.description}</p>

              {/* Pricing */}
              <div className="mb-6">
                {isAnnual ? (
                  <div>
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-4xl font-bold text-gray-900">
                        R$ {plan.monthlyPriceAnnual.toFixed(2)}
                      </span>
                      <span className="text-gray-500">/mês</span>
                    </div>
                    <div className="text-sm text-gray-500">
                      <span className="line-through">R$ {(plan.monthlyPrice * 12).toFixed(2)}</span>
                      <span className="ml-2 text-green-600 font-semibold">
                        Economize R$ {plan.savings.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-400 mt-1">
                      Faturado anualmente: R$ {plan.annualPrice.toFixed(2)}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-bold text-gray-900">
                      R$ {plan.monthlyPrice.toFixed(2)}
                    </span>
                    <span className="text-gray-500">/mês</span>
                  </div>
                )}
              </div>
            </div>

            {/* Features */}
            <div className="grid md:grid-cols-2 gap-3 mb-8">
              {plan.features.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 text-sm">{feature}</span>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* Primary Subscribe Button */}
              <Button 
                onClick={handleSubscribe}
                className="w-full h-12 bg-gradient-to-r from-camply-blue to-camply-green hover:from-camply-blue/90 hover:to-camply-green/90 text-white font-semibold text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg group"
              >
                <span>Assinar Agora - {isAnnual ? 'Anual' : 'Mensal'}</span>
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            <div className="text-center mt-6">
              <p className="text-xs text-gray-500">
                🔒 Pagamento 100% seguro • Cancele quando quiser • Sem taxas de cancelamento
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PlanSelection;