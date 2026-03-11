import React from 'react';
import { Users, MessageCircle, BarChart, Settings, HelpCircle } from 'lucide-react';

export const IASupportSection: React.FC = () => {
  const supportItems = [
    {
      icon: HelpCircle,
      text: 'Tirar dúvidas sobre o uso da plataforma',
    },
    {
      icon: BarChart,
      text: 'Ajudar você a entender os resultados das campanhas',
    },
    {
      icon: Settings,
      text: 'Apoiar em ajustes de estratégia',
    },
    {
      icon: MessageCircle,
      text: 'Resolver qualquer problema técnico que possa surgir',
    },
  ];

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left content */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-6">
                IA na operação. Pessoas no suporte.
              </h2>
              
              <p className="text-camply-dark/80 text-base sm:text-lg mb-8">
                Apesar de toda a automação, você nunca está sozinho.
              </p>
              
              <p className="text-camply-dark/70 mb-6">Nosso time está disponível para:</p>
              
              <div className="space-y-4">
                {supportItems.map((item, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-camply-blue/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-5 h-5 text-camply-blue" />
                    </div>
                    <span className="text-camply-dark text-sm sm:text-base">{item.text}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 bg-camply-green-light rounded-2xl p-6">
                <p className="text-camply-dark font-medium">
                  A tecnologia faz o trabalho pesado.<br />
                  Mas a <strong>experiência humana</strong> continua ao seu lado.
                </p>
              </div>
            </div>
            
            {/* Right illustration */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="bg-camply-light rounded-3xl p-8">
                  <div className="w-32 h-32 rounded-full bg-camply-blue/10 flex items-center justify-center mx-auto mb-6">
                    <Users className="w-16 h-16 text-camply-blue" />
                  </div>
                  
                  <div className="text-center">
                    <h3 className="text-xl font-bold text-camply-dark mb-2">Suporte Humano</h3>
                    <p className="text-camply-dark/70 text-sm">de verdade</p>
                  </div>
                  
                  <div className="mt-6 flex justify-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-camply-green animate-pulse"></div>
                    <span className="text-sm text-camply-green font-medium">Online</span>
                  </div>
                </div>
                
                {/* Floating chat bubbles */}
                <div className="absolute -top-4 -right-4 bg-white rounded-xl p-3 shadow-lg ai-float">
                  <MessageCircle className="w-6 h-6 text-camply-blue" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-camply-yellow rounded-xl p-3 shadow-lg ai-float-slow">
                  <HelpCircle className="w-6 h-6 text-camply-dark" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
