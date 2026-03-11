
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export const LandingFooter: React.FC = () => {
  return (
    <footer className="bg-camply-dark relative overflow-hidden">
      {/* Solid separator */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-camply-green"></div>
      
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-5"></div>
      
      <div className="py-12 sm:py-16 lg:py-20 px-3 sm:px-4 relative">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10 lg:gap-12 mb-10 lg:mb-12">
            <div className="col-span-1 sm:col-span-2 lg:col-span-2 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start space-x-3 mb-4 lg:mb-5">
                <img 
                  src="/logos/camply-logo-transparente.png" 
                  alt="Camply" 
                  className="h-8 w-auto sm:h-10 lg:h-12 brightness-0 invert opacity-90"
                />
              </div>
              <p className="text-white/70 mb-4 lg:mb-5 text-base sm:text-lg leading-relaxed max-w-md mx-auto sm:mx-0">
                Anúncios no Meta com Inteligência Artificial. Simples, eficiente e sem complicação.
              </p>
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-white mb-4 lg:mb-5 text-lg sm:text-xl">Produto</h3>
              <ul className="space-y-3 text-white/70 text-base sm:text-lg">
                <li>
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto text-white/70 hover:text-camply-green text-base sm:text-lg transition-colors hover:bg-transparent"
                  >
                    Funcionalidades
                  </Button>
                </li>
                <li>
                  <Button 
                    variant="ghost" 
                    className="p-0 h-auto text-white/70 hover:text-camply-green text-base sm:text-lg transition-colors hover:bg-transparent"
                  >
                    Preços
                  </Button>
                </li>
              </ul>
            </div>
            
            <div className="text-center sm:text-left">
              <h3 className="font-bold text-white mb-4 lg:mb-5 text-lg sm:text-xl">Suporte</h3>
              <ul className="space-y-3 text-white/70 text-base sm:text-lg">
                <li>
                  <Link 
                    to="/legal/privacy" 
                    className="hover:text-camply-green transition-colors touch-target inline-block"
                  >
                    Privacidade
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/legal/terms" 
                    className="hover:text-camply-green transition-colors touch-target inline-block"
                  >
                    Termos
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 lg:pt-10 text-center text-white/50 text-sm sm:text-base lg:text-lg">
            <p>&copy; 2024 Camply. Todos os direitos reservados.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
