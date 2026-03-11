import React from 'react';
import { Target, Brain, Rocket, RefreshCw, ArrowRight } from 'lucide-react';

export const IAHowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '1',
      icon: Target,
      title: 'Você informa o básico',
      description: 'Seu objetivo, quanto quer investir, o que quer anunciar e para qual região quer aparecer.',
      color: 'bg-camply-yellow',
      iconColor: 'text-camply-dark',
    },
    {
      number: '2',
      icon: Brain,
      title: 'A Camply.ia monta a campanha',
      description: 'A IA transforma essas informações em uma campanha completa: copy, título, público e configurações técnicas.',
      color: 'bg-camply-blue',
      iconColor: 'text-white',
    },
    {
      number: '3',
      icon: Rocket,
      title: 'A campanha entra no ar',
      description: 'O anúncio é publicado diretamente na sua conta de anúncios, seguindo as regras da Meta.',
      color: 'bg-camply-green',
      iconColor: 'text-white',
    },
    {
      number: '4',
      icon: RefreshCw,
      title: 'A IA continua trabalhando',
      description: 'Depois de publicar, a Camply continua monitorando resultados e fazendo ajustes de otimização.',
      color: 'bg-camply-blue',
      iconColor: 'text-white',
    },
  ];

  return (
    <section id="como-funciona" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-4">
            Como funciona na prática?
          </h2>
          <p className="text-camply-dark/70 text-base sm:text-lg max-w-2xl mx-auto">
            Criar uma campanha com o Camply é tão simples quanto explicar o que você quer vender.
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-4">
            {steps.map((step, index) => (
              <div key={index} className="relative">
                <div className="bg-camply-light rounded-2xl p-6 h-full hover:shadow-lg transition-shadow">
                  {/* Step number and icon */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 ${step.color} rounded-xl flex items-center justify-center`}>
                      <step.icon className={`w-6 h-6 ${step.iconColor}`} />
                    </div>
                    <span className="text-3xl font-bold text-camply-dark/20">{step.number}</span>
                  </div>
                  
                  {/* Content */}
                  <h3 className="text-lg font-bold text-camply-dark mb-2">
                    {step.title}
                  </h3>
                  <p className="text-camply-dark/70 text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
                
                {/* Arrow (hidden on last item and mobile) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-1/2 -right-2 transform -translate-y-1/2 z-10">
                    <ArrowRight className="w-4 h-4 text-camply-dark/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Flow diagram for mobile */}
          <div className="mt-10 flex justify-center lg:hidden">
            <div className="flex items-center gap-2 text-sm text-camply-dark/50">
              <span>Seu negócio</span>
              <ArrowRight className="w-4 h-4" />
              <span>Camply.ia</span>
              <ArrowRight className="w-4 h-4" />
              <span>Meta Ads</span>
              <ArrowRight className="w-4 h-4" />
              <span>WhatsApp</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
