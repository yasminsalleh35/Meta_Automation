import React from 'react';
import { HelpCircle, TrendingDown, Clock, AlertTriangle } from 'lucide-react';

export const IAWhyExistsSection: React.FC = () => {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left content */}
          <div>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-6">
              Por que criamos o Camply?
            </h2>
            
            <div className="space-y-6 text-camply-dark/80 text-base sm:text-lg leading-relaxed">
              <p>
                Anunciar no Meta (Facebook e Instagram) ficou complexo demais para quem só quer vender.
              </p>
              
              <p>
                Painéis cheios de opções, termos técnicos, botões confusos, necessidade de gestor, contratos caros…
              </p>
              
              <p>
                Enquanto isso, milhares de empreendedores e prestadores de serviço ficam dependentes de terceiros para simplesmente colocar um anúncio no ar.
              </p>
              
              <div className="bg-camply-green-light rounded-2xl p-6 border-l-4 border-camply-green">
                <p className="text-camply-dark font-medium">
                  O Camply nasceu para <strong>democratizar a publicidade</strong>: para que qualquer pessoa consiga criar campanhas profissionais, com alta performance, sem precisar entender de tráfego pago.
                </p>
              </div>
            </div>
          </div>
          
          {/* Right illustration */}
          <div className="relative flex justify-center">
            <div className="relative w-full max-w-md">
              {/* Confusion illustration */}
              <div className="bg-camply-light rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
                    <HelpCircle className="w-10 h-10 text-red-400 mb-2" />
                    <span className="text-sm text-camply-dark/70">Configurações confusas</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
                    <TrendingDown className="w-10 h-10 text-orange-400 mb-2" />
                    <span className="text-sm text-camply-dark/70">Resultados incertos</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
                    <Clock className="w-10 h-10 text-yellow-500 mb-2" />
                    <span className="text-sm text-camply-dark/70">Horas perdidas</span>
                  </div>
                  <div className="bg-white rounded-xl p-4 shadow-sm flex flex-col items-center justify-center text-center">
                    <AlertTriangle className="w-10 h-10 text-red-500 mb-2" />
                    <span className="text-sm text-camply-dark/70">Custos altos</span>
                  </div>
                </div>
                
                <div className="mt-6 text-center">
                  <div className="inline-flex items-center gap-2 bg-red-50 text-red-600 rounded-full px-4 py-2 text-sm">
                    <AlertTriangle className="w-4 h-4" />
                    Gerenciador de Anúncios complexo
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
