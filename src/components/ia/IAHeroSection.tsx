import React from 'react';
import { Button } from '@/components/ui/button';
import { Rocket, Bot, DollarSign, Sparkles, Zap, Target } from 'lucide-react';
import { Link } from 'react-router-dom';

export const IAHeroSection: React.FC = () => {
  const scrollToHowItWorks = () => {
    const section = document.getElementById('como-funciona');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <section className="bg-camply-blue relative overflow-hidden py-16 sm:py-20 lg:py-28">
      {/* Background patterns */}
      <div className="absolute inset-0 dot-pattern opacity-10"></div>
      <div className="absolute top-20 right-10 w-72 h-72 bg-camply-green/20 rounded-full blur-3xl ai-float-slow"></div>
      <div className="absolute bottom-10 left-10 w-96 h-96 bg-camply-yellow/20 rounded-full blur-3xl ai-float"></div>
      
      <div className="container mx-auto px-4 sm:px-6 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Left content */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-camply-yellow" />
              <span className="text-white/90 text-sm font-medium">Inteligência Artificial para Anúncios</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-white mb-6 leading-tight">
              Camply.ia: sua IA especialista em anúncios
            </h1>
            
            <p className="text-lg sm:text-xl text-white/85 mb-8 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Crie, otimize e gerencie campanhas profissionais no Meta Ads — com a facilidade de conversar com um gestor e a eficiência de uma inteligência artificial.
            </p>
            
            {/* Value bullets */}
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 mb-10 justify-center lg:justify-start">
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full bg-camply-green/20 flex items-center justify-center">
                  <Rocket className="w-5 h-5 text-camply-green" />
                </div>
                <span className="text-sm sm:text-base">Campanhas prontas em minutos</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full bg-camply-yellow/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-camply-yellow" />
                </div>
                <span className="text-sm sm:text-base">Otimização 24h por dia</span>
              </div>
              <div className="flex items-center gap-3 text-white">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm sm:text-base">Até 80% mais econômico</span>
              </div>
            </div>
            
            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/#checkout">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-camply-yellow hover:bg-camply-yellow/90 text-camply-dark font-semibold shadow-xl hover:shadow-2xl transition-all px-8 py-6 text-lg"
                >
                  Começar com o Camply
                </Button>
              </Link>
              <Button 
                size="lg" 
                variant="outline"
                onClick={scrollToHowItWorks}
                className="w-full sm:w-auto border-2 border-white/30 bg-transparent text-white hover:bg-white/10 font-semibold px-8 py-6 text-lg"
              >
                Ver como funciona
              </Button>
            </div>
          </div>
          
          {/* Right visual */}
          <div className="relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-md">
              {/* Main card */}
              <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-2xl">
                <div className="flex items-center gap-4 mb-6">
                  <img 
                    src="/logos/camply-logo-transparente.png" 
                    alt="Camply" 
                    className="h-12 w-auto brightness-0 invert"
                  />
                </div>
                
                {/* Dashboard mockup */}
                <div className="space-y-4">
                  <div className="bg-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white/70 text-sm">Campanha Ativa</span>
                      <span className="bg-camply-green/20 text-camply-green text-xs px-2 py-1 rounded-full">Publicada</span>
                    </div>
                    <div className="text-white font-semibold">Promoção de Verão</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <Target className="w-5 h-5 text-camply-yellow mx-auto mb-2" />
                      <div className="text-white text-lg font-bold">2.5K</div>
                      <div className="text-white/60 text-xs">Alcance</div>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                      <Zap className="w-5 h-5 text-camply-green mx-auto mb-2" />
                      <div className="text-white text-lg font-bold">48</div>
                      <div className="text-white/60 text-xs">Leads</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 bg-camply-green rounded-2xl p-4 shadow-xl ai-float">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-camply-yellow rounded-2xl p-4 shadow-xl ai-float-slow">
                <Sparkles className="w-8 h-8 text-camply-dark" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
