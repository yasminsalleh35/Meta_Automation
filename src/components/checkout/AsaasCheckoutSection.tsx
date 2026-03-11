import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Check, Shield, Zap, Sparkles } from 'lucide-react';
import { useAsaasPublicCheckout } from '@/hooks/useAsaasPublicCheckout';

export const AsaasCheckoutSection: React.FC = () => {
  const { loading, startCheckout } = useAsaasPublicCheckout();

  const commonFeatures = [
    'Campanhas ilimitadas no Meta Ads',
    'Gestão completa de anúncios',
    'Relatórios em tempo real',
    'Suporte prioritário'
  ];

  const premiumFeatures = [
    '2 meses de desconto',
    'Economia de R$ 1.200',
    'Parcelamento em até 12x',
    'Acesso prioritário a novidades'
  ];

  return (
    <div id="checkout" className="py-20 sm:py-24 lg:py-28 px-4 bg-white relative overflow-hidden">
      {/* Pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-30"></div>
      
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold mb-4 text-camply-dark">
            Escolha seu plano
          </h2>
          <p className="text-xl sm:text-2xl text-camply-dark/70">
            Comece a escalar suas campanhas hoje mesmo
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-10 max-w-5xl mx-auto">
          {/* Plano Mensal */}
          <Card className="p-8 lg:p-10 hover:shadow-2xl transition-all duration-300 border-2 border-gray-200 hover:border-camply-blue/40 bg-white hover:scale-105">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 text-camply-dark">Plano Mensal</h3>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-black text-camply-blue">R$ 249</span>
                <span className="text-camply-dark/60 text-lg">/mês</span>
              </div>
            </div>

            <Button
              onClick={() => startCheckout('mensal')}
              disabled={loading}
              className="w-full mb-8 bg-camply-blue hover:bg-camply-blue/90 text-white py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
              size="lg"
            >
              {loading ? 'Processando...' : 'Assinar Mensal'}
            </Button>

            <div className="space-y-4 mb-8">
              {commonFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-camply-green/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-camply-green" />
                  </div>
                  <span className="text-base text-camply-dark">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-sm text-camply-dark/60">
                <Shield className="w-5 h-5 text-camply-blue" />
                <span>Pagamento seguro</span>
              </div>
            </div>
          </Card>

          {/* Plano Anual */}
          <Card className="p-8 lg:p-10 hover:shadow-2xl transition-all duration-300 border-2 border-camply-green relative overflow-hidden bg-white hover:scale-105">
            <div className="absolute top-6 right-6 bg-camply-green text-white px-4 py-2 rounded-full text-sm font-black shadow-lg flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              MAIS POPULAR
            </div>

            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold mb-4 text-camply-dark">Plano Anual</h3>
              <div className="flex items-baseline justify-center gap-2 mb-3">
                <span className="text-5xl font-black text-camply-blue">R$ 2.999</span>
                <span className="text-camply-dark/60 text-lg">/ano</span>
              </div>
              <p className="text-base text-camply-dark/60 mb-3">
                ou 12x de R$ 249,99
              </p>
              <div className="inline-block bg-camply-yellow px-5 py-2 rounded-full text-base font-bold text-camply-dark shadow-md">
                💰 Economize R$ 1.200
              </div>
            </div>

            <Button
              onClick={() => startCheckout('anual')}
              disabled={loading}
              className="w-full mb-8 bg-camply-blue hover:bg-camply-blue/90 text-white py-6 text-lg font-bold shadow-xl hover:shadow-2xl transition-all"
              size="lg"
              variant="default"
            >
              {loading ? 'Processando...' : 'Assinar Anual'}
            </Button>

            <div className="space-y-4 mb-8">
              {commonFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-camply-green/10 flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-camply-green" />
                  </div>
                  <span className="text-base text-camply-dark">{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-3 p-5 bg-camply-green-light rounded-2xl border border-camply-green/30 mb-6">
              <div className="font-bold text-base mb-3 flex items-center gap-2 text-camply-dark">
                <Zap className="w-5 h-5 text-camply-blue" />
                Bônus do Plano Anual
              </div>
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="flex items-start gap-2">
                  <span className="text-lg">🎯</span>
                  <span className="text-sm text-camply-dark/80 font-medium">{feature}</span>
                </div>
              ))}
            </div>

            <div className="pt-6 border-t border-gray-200">
              <div className="flex items-center gap-3 text-sm text-camply-dark/60">
                <Shield className="w-5 h-5 text-camply-blue" />
                <span>Pagamento seguro • Parcelamento sem juros</span>
              </div>
            </div>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-base text-camply-dark/60 font-medium">
            ✓ Cancele quando quiser • ✓ Suporte 24/7 • ✓ Sem taxas ocultas
          </p>
        </div>
      </div>
    </div>
  );
};