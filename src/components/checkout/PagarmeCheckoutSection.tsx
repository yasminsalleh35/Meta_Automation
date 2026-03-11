import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowRight, Check, Star, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { PagarmeCheckoutModalV5 } from './PagarmeCheckoutModalV5';

interface PagarmeConfigV5 {
  environment: string;
  public_key: string;
  plan_id_mensal: string | null;
  plan_id_anual: string | null;
}

export const PagarmeCheckoutSection: React.FC = () => {
  const [config, setConfig] = useState<PagarmeConfigV5 | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'mensal' | 'anual'>('mensal');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      // ✅ SEMPRE buscar configuração de PRODUÇÃO para checkout público
      const { data, error } = await supabase
        .rpc('get_pagarme_config_for_functions', { p_environment: 'live' })
        .single();

      if (error) throw error;
      
      if (!data) {
        console.warn('[Checkout V5] No config found');
        return;
      }

      // Type assertion para a resposta da função RPC
      const configData = data as {
        environment: string;
        public_key: string;
        plan_id_mensal: string | null;
        plan_id_anual: string | null;
      };
      
      console.log('[Checkout V5] Config loaded:', { 
        environment: configData.environment,
        has_public_key: !!configData.public_key,
        has_plan_mensal: !!configData.plan_id_mensal,
        has_plan_anual: !!configData.plan_id_anual
      });
      
      setConfig({
        environment: configData.environment,
        public_key: configData.public_key,
        plan_id_mensal: configData.plan_id_mensal,
        plan_id_anual: configData.plan_id_anual
      });
    } catch (error) {
      console.error('[Checkout V5] Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanClick = (planCode: 'mensal' | 'anual') => {
    if (!config) {
      console.error('[Checkout V5] Config not loaded');
      return;
    }
    
    setSelectedPlan(planCode);
    setShowModal(true);
  };

  const commonFeatures = [
    'Campanhas Ilimitadas',
    'Relatórios completos',
    'Suporte de especialista',
    'Material de instrução e aprendizado'
  ];

  const premiumFeatures = [
    { 
      text: 'Implantação e setup incluso',
      tooltip: 'A equipe fará toda a integração da estrutura do usuário',
      highlight: true
    },
    { text: 'Suporte com especialista', highlight: true },
    { text: 'Avaliação de estratégia de marketing', highlight: true }
  ];

  return (
    <TooltipProvider>
      <section id="checkout" className="py-8 sm:py-12 lg:py-16 xl:py-20 px-3 sm:px-4 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4 leading-tight px-2">
            Escolha o plano ideal para você
          </h2>
          <p className="text-white/90 text-base sm:text-lg mb-8 sm:mb-10 px-2">
            Tudo que você precisa para criar campanhas de alto impacto
          </p>
          
          <div className="max-w-6xl mx-auto px-2 sm:px-0">
            <div className="grid md:grid-cols-2 gap-6 lg:gap-8 mb-8 sm:mb-10">
              {/* Plano Mensal */}
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10 border-2 border-gray-200 hover:border-blue-300 hover:shadow-2xl transition-all duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Plano Mensal</h3>
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-gray-900">R$ 349</span>
                    <span className="text-2xl font-bold text-gray-900">,99</span>
                  </div>
                  <div className="text-base text-gray-600 mb-6">por mês</div>
                </div>

                <div className="space-y-4 mb-8 text-left">
                  {commonFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={() => handlePlanClick('mensal')}
                  size="lg" 
                  variant="outline"
                  className="w-full py-4 text-base sm:text-lg font-semibold border-2 border-blue-600 text-blue-600 hover:bg-blue-50 hover:border-blue-700 transition-all"
                >
                  Assinar Mensal
                </Button>
                
                <p className="text-xs text-gray-500 mt-4">Flexibilidade total • Cancele quando quiser</p>
              </div>

              {/* Plano Anual - Destacado */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 border-4 border-yellow-400 relative transform hover:scale-105 transition-all duration-300">
                {/* Badge de destaque */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-10">
                  <div className="bg-yellow-400 text-blue-900 px-6 py-2 rounded-full text-sm sm:text-base font-extrabold shadow-xl flex items-center gap-2">
                    <Star className="w-4 h-4 fill-current" />
                    MAIS POPULAR
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                </div>
                
                <div className="text-center text-white mb-6 pt-4">
                  <h3 className="text-2xl sm:text-3xl font-bold mb-4">Plano Anual</h3>
                  
                  <div className="mb-3">
                    <span className="text-lg sm:text-xl line-through opacity-75">de R$ 4.199,88</span>
                  </div>
                  
                  <div className="flex items-baseline justify-center mb-2">
                    <span className="text-4xl sm:text-5xl font-extrabold">R$ 2.499</span>
                    <span className="text-2xl font-bold">,99</span>
                  </div>
                  
                  <div className="bg-green-500 text-white px-4 py-2 rounded-full text-sm sm:text-base font-bold mb-3 inline-block shadow-lg">
                    💰 Economize R$ 1.700
                  </div>
                  
                  <div className="text-base sm:text-lg opacity-95 mb-6">
                    ou <span className="font-bold">12x de R$ 208,25</span> sem juros
                  </div>
                </div>

                <div className="space-y-3 mb-6 text-left">
                  <div className="text-white font-semibold text-sm mb-3 opacity-90">
                    Tudo do Plano Mensal, mais:
                  </div>
                  
                  {commonFeatures.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-300 flex-shrink-0 mt-0.5" />
                      <span className="text-white/90 text-sm sm:text-base">{feature}</span>
                    </div>
                  ))}
                  
                  <div className="border-t border-white/20 my-4 pt-4">
                    <div className="text-yellow-300 font-bold text-sm mb-3 flex items-center gap-2">
                      <Star className="w-4 h-4 fill-current" />
                      Benefícios Exclusivos:
                    </div>
                    
                    {premiumFeatures.map((feature, index) => (
                      <div key={index} className="flex items-start gap-3 mb-3 bg-white/10 rounded-lg p-3 backdrop-blur-sm">
                        <Star className="w-5 h-5 text-yellow-300 fill-current flex-shrink-0 mt-0.5" />
                        <div className="flex-1 flex items-center gap-2">
                          <span className="text-white font-semibold text-sm sm:text-base">{feature.text}</span>
                          {feature.tooltip && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Info className="w-4 h-4 text-yellow-300 cursor-help flex-shrink-0" />
                              </TooltipTrigger>
                              <TooltipContent className="max-w-xs">
                                <p className="text-sm">{feature.tooltip}</p>
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  onClick={() => handlePlanClick('anual')}
                  size="lg" 
                  className="w-full py-4 text-base sm:text-lg font-extrabold bg-white text-blue-600 hover:bg-yellow-50 shadow-2xl hover:shadow-3xl transition-all"
                >
                  ⚡ Assinar Anual Agora
                </Button>
                
                <p className="text-xs text-white/80 mt-4">Melhor custo-benefício • Implantação inclusa</p>
              </div>
            </div>

            {/* Call to Action Button */}
            <div className="text-center">
              <Button 
                onClick={() => handlePlanClick('mensal')}
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-50 px-8 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 min-h-[56px] touch-target"
              >
                👉 Comece Agora
                <ArrowRight className="ml-3 w-5 h-5 sm:w-6 sm:h-6" />
              </Button>
              <p className="text-white/80 text-sm mt-4">Escolha seu plano e transforme suas campanhas</p>
            </div>
          </div>

          {config && config.public_key && (
            <PagarmeCheckoutModalV5
              open={showModal}
              onClose={() => setShowModal(false)}
              planCode={selectedPlan}
              publicKey={config.public_key}
              environment={config.environment as 'test' | 'live'}
            />
          )}
        </div>
      </section>
    </TooltipProvider>
  );
};