import React from 'react';
import { X } from 'lucide-react';

export const IANoNeedSection: React.FC = () => {
  const noNeeds = [
    'Entender de tráfego pago',
    'Configurar pixel, eventos ou API de conversão',
    'Ficar horas no Gerenciador de Anúncios',
    'Saber escrever copy persuasiva',
    'Contratar designer, agência ou consultoria',
  ];

  return (
    <section className="bg-camply-green-light py-16 sm:py-20 lg:py-24">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-10">
            Com a Camply, você NÃO precisa…
          </h2>
          
          <div className="space-y-4 mb-10">
            {noNeeds.map((item, index) => (
              <div 
                key={index}
                className="bg-white rounded-xl p-4 sm:p-5 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-5 h-5 text-red-500" />
                </div>
                <span className="text-camply-dark text-base sm:text-lg text-left">{item}</span>
              </div>
            ))}
          </div>
          
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-lg">
            <p className="text-camply-dark text-base sm:text-lg leading-relaxed">
              Se você sabe <strong>o que vende</strong> e <strong>para quem quer vender</strong>,<br />
              a Camply te ajuda a transformar isso em anúncios que funcionam.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
