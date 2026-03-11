
import React from 'react';
import { Search } from 'lucide-react';

export const ProblemSection: React.FC = () => {
  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24 px-3 sm:px-4 bg-white relative">
      {/* Subtle grid pattern */}
      <div className="absolute inset-0 grid-pattern opacity-50"></div>
      
      <div className="container mx-auto text-center relative">
        <div className="max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-red-50 via-orange-50 to-camply-blue-light border-2 border-red-200/50 rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 mb-8 sm:mb-12 shadow-xl hover:shadow-2xl transition-shadow relative overflow-hidden">
            {/* Decorative gradient overlay */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-camply-blue/10 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-camply-green/10 to-transparent rounded-full blur-3xl"></div>
            
            <div className="relative z-10">
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6 shadow-lg">
                <Search className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
              </div>
              
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-4 sm:mb-5 leading-tight">
                Você já perdeu dinheiro tentando anunciar sozinho?
              </h2>
              
              <p className="text-lg sm:text-xl text-camply-dark/80 mb-4 sm:mb-5 leading-relaxed">
                Ou contratando alguém que prometia resultados mas não entregou?
              </p>
              
              <div className="inline-block bg-gradient-to-r from-camply-blue to-camply-green px-6 py-3 rounded-full">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-white leading-relaxed">
                  Com o Camply, você não precisa ser expert nem contratar uma agência.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
