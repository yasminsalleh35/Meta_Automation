import React from 'react';
import { User, Bot, Check, X, Clock, Users } from 'lucide-react';

export const IAEconomySection: React.FC = () => {
  return (
    <section className="bg-camply-blue py-16 sm:py-20 lg:py-24 relative overflow-hidden">
      <div className="absolute inset-0 dot-pattern opacity-10"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            O mesmo nível de resultado, com muito menos custo.
          </h2>
          <p className="text-white/80 text-base sm:text-lg max-w-2xl mx-auto">
            Ter um bom gestor de tráfego é incrível — mas nem todo negócio consegue pagar R$1.500 a R$2.000 por mês.
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* Traditional manager */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Gestor tradicional</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/70">Honorário mensal</span>
                  <span className="text-white font-semibold">R$1.500 a R$2.500</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-white/10">
                  <span className="text-white/70">Disponibilidade</span>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-white/50" />
                    <span className="text-white/70">Horário comercial</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-white/70">Capacidade</span>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-white/50" />
                    <span className="text-white/70">Limite de clientes</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Camply */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl relative">
              <div className="absolute -top-3 -right-3 bg-camply-green text-white text-xs font-bold px-3 py-1 rounded-full">
                RECOMENDADO
              </div>
              
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-camply-blue/10 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-camply-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-camply-dark">Camply.ia</h3>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-camply-dark/70">Assinatura</span>
                  <span className="text-camply-green font-bold text-lg">A partir de R$208/mês</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-camply-dark/70">Disponibilidade</span>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-camply-green" />
                    <span className="text-camply-dark font-medium">24h por dia, 7 dias</span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-camply-dark/70">Capacidade</span>
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-camply-green" />
                    <span className="text-camply-dark font-medium">Múltiplas campanhas</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto">
              Você continua investindo em anúncios, mas agora com <strong>muito mais eficiência por real investido</strong>.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
