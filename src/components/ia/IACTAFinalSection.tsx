import React from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';

export const IACTAFinalSection: React.FC = () => {
  return (
    <section className="bg-camply-blue py-16 sm:py-20 lg:py-28 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 dot-pattern opacity-10"></div>
      <div className="absolute top-10 right-20 w-64 h-64 bg-camply-green/20 rounded-full blur-3xl ai-float-slow"></div>
      <div className="absolute bottom-10 left-20 w-80 h-80 bg-camply-yellow/20 rounded-full blur-3xl ai-float"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <Sparkles className="w-4 h-4 text-camply-yellow" />
            <span className="text-white/90 text-sm font-medium">Comece agora mesmo</span>
          </div>
          
          <h2 className="text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold text-white mb-6 leading-tight">
            Pronto para ter uma IA de tráfego trabalhando por você?
          </h2>
          
          <p className="text-white/85 text-base sm:text-lg lg:text-xl mb-10 leading-relaxed max-w-2xl mx-auto">
            Crie campanhas profissionais, otimizadas e conectadas ao seu WhatsApp em poucos minutos.
            <br />
            <strong>Sem complicação, sem contrato, sem depender de agência.</strong>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/#checkout">
              <Button 
                size="lg" 
                className="w-full sm:w-auto bg-camply-yellow hover:bg-camply-yellow/90 text-camply-dark font-semibold shadow-xl hover:shadow-2xl transition-all px-8 py-6 text-lg group"
              >
                Começar com o Camply agora
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/">
              <Button 
                size="lg" 
                variant="outline"
                className="w-full sm:w-auto border-2 border-white/30 bg-transparent text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg"
              >
                Ver um exemplo de campanha
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
