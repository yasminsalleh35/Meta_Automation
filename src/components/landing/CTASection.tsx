
import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, CheckCircle, Zap, ArrowRight, Sparkles } from 'lucide-react';

const scrollToCheckout = () => {
  const checkoutSection = document.getElementById('checkout');
  if (checkoutSection) {
    checkoutSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

export const CTASection: React.FC = () => {
  return (
    <section className="py-16 sm:py-20 lg:py-24 xl:py-28 px-3 sm:px-4 relative overflow-hidden bg-camply-blue">
      {/* Grid pattern overlay */}
      <div className="absolute inset-0 grid-pattern opacity-20"></div>
      
      {/* Floating sparkles */}
      <div className="absolute top-10 left-10 opacity-30">
        <Sparkles className="w-8 h-8 text-white ai-float" />
      </div>
      <div className="absolute bottom-20 right-20 opacity-30">
        <Sparkles className="w-10 h-10 text-white ai-float-slow" />
      </div>
      <div className="absolute top-1/2 right-10 opacity-20">
        <Sparkles className="w-6 h-6 text-white ai-float" />
      </div>
      
      <div className="container mx-auto text-center relative z-10">
        <h2 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 sm:mb-8 leading-tight px-2">
          Comece agora mesmo
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 justify-center items-center mb-8 sm:mb-10 max-w-3xl mx-auto">
          <div className="flex items-center justify-center text-white text-base sm:text-lg lg:text-xl bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 hover:bg-white/20 transition-all">
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 mr-3 text-camply-yellow flex-shrink-0" />
            <span className="leading-tight font-medium">Sem precisar entender de anúncios</span>
          </div>
          <div className="flex items-center justify-center text-white text-base sm:text-lg lg:text-xl bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 hover:bg-white/20 transition-all">
            <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 mr-3 text-camply-yellow flex-shrink-0" />
            <span className="leading-tight font-medium">Sem riscos</span>
          </div>
          <div className="flex items-center justify-center text-white text-base sm:text-lg lg:text-xl bg-white/15 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/20 hover:bg-white/20 transition-all">
            <Zap className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 mr-3 text-camply-yellow flex-shrink-0" />
            <span className="leading-tight font-medium">Sem complicação</span>
          </div>
        </div>
        
        <p className="text-xl sm:text-2xl lg:text-3xl text-white mb-8 sm:mb-10 font-bold leading-relaxed px-4">
          Camply. O poder dos anúncios com inteligência — ao seu alcance.
        </p>
        
        <Button 
          onClick={scrollToCheckout}
          size="lg" 
          className="bg-camply-yellow hover:bg-camply-yellow/90 text-camply-dark px-10 sm:px-16 py-6 sm:py-8 text-xl sm:text-2xl font-black shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 min-h-[64px] touch-target"
        >
          👉 Assinar Agora
          <ArrowRight className="ml-3 w-6 h-6 sm:w-8 sm:h-8" />
        </Button>
      </div>
    </section>
  );
};
