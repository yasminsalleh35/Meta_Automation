import React from 'react';
import { Bot, Check, Sparkles } from 'lucide-react';

export const IAWhatIsSection: React.FC = () => {
  const features = [
    'Cria campanhas completas',
    'Define o público ideal',
    'Ajusta posicionamentos',
    'Publica na sua conta de anúncios',
    'Acompanha e otimiza os resultados',
  ];

  return (
    <section className="bg-camply-green-light py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-4">
            O que é o Camply.ia?
          </h2>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center max-w-5xl mx-auto">
          {/* Left content */}
          <div className="space-y-6">
            <p className="text-camply-dark/80 text-base sm:text-lg leading-relaxed">
              O Camply é uma <strong>inteligência artificial dedicada à criação e gestão de anúncios</strong> no Meta Ads.
            </p>
            
            <p className="text-camply-dark/80 text-base sm:text-lg leading-relaxed">
              Ele faz o mesmo papel de um gestor de tráfego:
            </p>
            
            <ul className="space-y-3">
              {features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full bg-camply-green flex items-center justify-center flex-shrink-0">
                    <Check className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-camply-dark text-base sm:text-lg">{feature}</span>
                </li>
              ))}
            </ul>
            
            <div className="bg-white rounded-2xl p-6 shadow-lg border-l-4 border-camply-blue">
              <p className="text-camply-dark font-medium">
                Com uma diferença importante: a IA trabalha com <strong>dados em tempo real</strong>, sem pausa e sem distração.
              </p>
            </div>
          </div>
          
          {/* Right card */}
          <div className="flex justify-center">
            <div className="bg-white rounded-3xl p-8 shadow-xl max-w-sm w-full">
              <div className="flex items-center justify-center mb-6">
                <div className="w-20 h-20 rounded-full bg-camply-blue/10 flex items-center justify-center">
                  <Bot className="w-12 h-12 text-camply-blue" />
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-camply-dark mb-2">IA Especialista</h3>
                <p className="text-camply-dark/70 mb-4">em Tráfego Pago</p>
                
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 text-camply-yellow" />
                  <span className="text-sm text-camply-dark/60">Powered by AI</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-camply-dark/60">Status</span>
                  <span className="bg-camply-green/10 text-camply-green px-3 py-1 rounded-full font-medium">
                    Ativo 24/7
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
