import React from 'react';
import { User, Bot, Check } from 'lucide-react';

export const IAComparisonSection: React.FC = () => {
  const userTasks = [
    'Definir seu objetivo (ex: captar novos clientes)',
    'Informar o orçamento diário ou mensal',
    'Descrever o serviço ou produto',
    'Escolher a região/localidade',
    'Informar seu WhatsApp',
  ];

  const camplyTasks = [
    'Gerar copy e título persuasivos',
    'Escolher interesses e segmentação',
    'Definir posicionamentos (Feed, Stories, Reels etc.)',
    'Configurar otimização via API da Meta',
    'Ajustar o anúncio para melhorar resultados',
  ];

  return (
    <section className="bg-camply-light py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-4">
            Você faz o simples. A Camply faz o complexo.
          </h2>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* User column */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-camply-blue/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-camply-blue" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-camply-dark">Você faz</h3>
                  <p className="text-sm text-camply-dark/60">O simples</p>
                </div>
              </div>
              
              <p className="text-camply-dark/70 mb-6">Você só precisa:</p>
              
              <ul className="space-y-4">
                {userTasks.map((task, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-camply-green/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-camply-green" />
                    </div>
                    <span className="text-camply-dark text-sm sm:text-base">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Camply column */}
            <div className="bg-camply-blue rounded-3xl p-6 sm:p-8 shadow-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">A Camply faz</h3>
                  <p className="text-sm text-white/70">O complexo</p>
                </div>
              </div>
              
              <p className="text-white/80 mb-6">A Camply cuida de:</p>
              
              <ul className="space-y-4">
                {camplyTasks.map((task, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-5 h-5 rounded-full bg-camply-green/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-camply-green" />
                    </div>
                    <span className="text-white text-sm sm:text-base">{task}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-10 text-center">
            <p className="text-camply-dark/70 text-base sm:text-lg max-w-2xl mx-auto">
              No fim, é como se você tivesse um <strong className="text-camply-dark">time de marketing inteiro</strong> resumido em uma única plataforma.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
