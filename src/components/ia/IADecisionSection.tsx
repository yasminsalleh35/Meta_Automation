import React from 'react';
import { Brain, Database, Cpu, Settings, ArrowRight } from 'lucide-react';

export const IADecisionSection: React.FC = () => {
  const analyzes = [
    'O tipo de negócio',
    'A oferta ou serviço que você quer divulgar',
    'O público que você deseja atingir',
    'A localização',
    'Os resultados das campanhas que já rodaram',
  ];

  const defines = [
    'Interesses e comportamentos mais compatíveis',
    'Melhor formato de anúncio',
    'Posicionamentos mais eficientes',
    'Ajustes de orçamento e entrega',
  ];

  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-4">
            Como a Camply.ia toma decisões?
          </h2>
        </div>
        
        <div className="max-w-5xl mx-auto">
          {/* Flow diagram */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            {[
              { icon: Database, label: 'Negócio' },
              { icon: Cpu, label: 'Dados' },
              { icon: Brain, label: 'IA' },
              { icon: Settings, label: 'Otimização' },
            ].map((item, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-2xl bg-camply-blue/10 flex items-center justify-center mb-2">
                    <item.icon className="w-8 h-8 text-camply-blue" />
                  </div>
                  <span className="text-sm text-camply-dark font-medium">{item.label}</span>
                </div>
                {index < 3 && (
                  <div className="flex items-center">
                    <ArrowRight className="w-5 h-5 text-camply-dark/30" />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {/* What AI analyzes */}
            <div className="bg-camply-light rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-camply-blue flex items-center justify-center">
                  <Database className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-camply-dark">O que a IA analisa</h3>
              </div>
              
              <p className="text-camply-dark/70 mb-4">
                Por trás de cada campanha criada pela Camply, existe uma inteligência que analisa:
              </p>
              
              <ul className="space-y-3">
                {analyzes.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-camply-blue"></div>
                    <span className="text-camply-dark text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* What AI defines */}
            <div className="bg-camply-green-light rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-camply-green flex items-center justify-center">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-lg font-bold text-camply-dark">O que a IA define</h3>
              </div>
              
              <p className="text-camply-dark/70 mb-4">
                A partir desses dados, a IA define:
              </p>
              
              <ul className="space-y-3">
                {defines.map((item, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-camply-green"></div>
                    <span className="text-camply-dark text-sm sm:text-base">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          
          <div className="mt-10 bg-camply-blue-light rounded-2xl p-6 text-center">
            <p className="text-camply-dark/80 text-sm sm:text-base max-w-3xl mx-auto">
              Tudo isso conectado diretamente à <strong>API oficial da Meta</strong>, permitindo uma otimização contínua — não só no momento em que você cria o anúncio, mas enquanto ele está rodando.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
