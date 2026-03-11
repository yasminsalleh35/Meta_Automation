
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, ArrowRight, Play, Sparkles } from 'lucide-react';

const scrollToCheckout = () => {
  const checkoutSection = document.getElementById('checkout');
  if (checkoutSection) {
    checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

interface HeroSectionProps {
  onDemoClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onDemoClick }) => {
  const benefits = [
    'Fácil de usar',
    'Totalmente intuitivo',
    'Sem risco de desperdiçar dinheiro',
    'Otimização automática com IA',
    'Relatórios e análises automáticas'
  ];

  return (
    <section className="py-12 px-3 sm:py-16 sm:px-4 lg:py-20 xl:py-24 relative overflow-hidden bg-camply-blue">
      {/* Floating particles */}
      <div className="absolute top-20 left-10 w-2 h-2 bg-white/20 rounded-full ai-float"></div>
      <div className="absolute top-40 right-20 w-3 h-3 bg-white/20 rounded-full ai-float-slow"></div>
      <div className="absolute bottom-32 left-1/4 w-2 h-2 bg-white/20 rounded-full ai-float"></div>
      <div className="absolute top-60 right-1/3 w-2 h-2 bg-white/20 rounded-full ai-float-slow"></div>
      
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-10"></div>
      
      <div className="container mx-auto text-center relative z-10">
        {/* Logo */}
        <div className="mb-6 sm:mb-8 flex justify-center">
          <img 
            src="/logos/camply-logo-transparente.png" 
            alt="Camply"
            className="h-16 sm:h-20 lg:h-24 w-auto ai-float"
          />
        </div>

        <Badge className="mb-4 sm:mb-6 bg-white text-camply-blue border-0 text-xs sm:text-sm lg:text-base px-4 py-2 sm:px-5 sm:py-2.5 shadow-lg">
          <Sparkles className="w-4 h-4 mr-2 inline" />
          Anúncios no Meta com IA
        </Badge>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-4 sm:mb-6 leading-tight px-2">
          Simples, Eficiente
          <br />
          e Sem Complicação
        </h1>
        
        <p className="text-lg sm:text-xl lg:text-2xl text-white mb-3 sm:mb-4 max-w-4xl mx-auto leading-relaxed px-4 font-semibold">
          Você não entende nada de anúncios? Ótimo.
        </p>
        
        <p className="text-base sm:text-lg lg:text-xl text-white/90 mb-8 sm:mb-10 max-w-4xl mx-auto leading-relaxed px-4">
          O Camply foi feito pra você. Cria, analisa e otimiza seus anúncios no Facebook e Instagram 
          usando IA especializada em performance — como se você tivesse um gestor de tráfego trabalhando 24h.
        </p>
        
        <div className="flex flex-col gap-3 sm:gap-4 justify-center items-center mb-8 sm:mb-10 px-4">
          <Button 
            onClick={scrollToCheckout}
            size="lg" 
            className="w-full sm:w-auto bg-camply-yellow hover:bg-camply-yellow/90 text-camply-dark px-8 sm:px-12 py-4 sm:py-6 text-base sm:text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 min-h-[56px] touch-target border-2 border-camply-dark/10"
          >
            Assinar Agora
            <ArrowRight className="ml-2 w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="w-full sm:w-auto px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-semibold border-2 border-white bg-white text-camply-blue hover:bg-white/90 min-h-[48px] touch-target transition-all"
            onClick={onDemoClick}
          >
            <Play className="mr-2 w-4 h-4 sm:w-5 sm:h-5" />
            Ver Como Funciona
          </Button>
        </div>

        {/* Benefits with Camply colors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:flex lg:flex-wrap lg:justify-center gap-2 sm:gap-3 lg:gap-4 text-xs sm:text-sm px-2">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center bg-white/95 backdrop-blur-sm px-4 py-3 sm:px-5 sm:py-3 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-camply-green mr-2 flex-shrink-0" />
              <span className="text-camply-dark font-medium leading-tight">{benefit}</span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Wave separator */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 120L60 110C120 100 240 80 360 70C480 60 600 60 720 65C840 70 960 80 1080 85C1200 90 1320 90 1380 90L1440 90V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white"/>
        </svg>
      </div>
    </section>
  );
};
