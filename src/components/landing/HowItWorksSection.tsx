
import React from 'react';
import { Target, Users, Sparkles, CheckCircle, Cpu, Brain } from 'lucide-react';
import { AIWorkflowAnimation } from './AIWorkflowAnimation';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      number: '1',
      title: 'Seu Objetivo',
      description: 'Defina sua meta (ex: vender pelo WhatsApp)',
      icon: Target
    },
    {
      number: '2',
      title: 'Público e Orçamento',
      description: 'Configure quem quer alcançar e quanto investir',
      icon: Users
    },
    {
      number: '3',
      title: 'Criativo',
      description: 'Adicione imagem e texto do anúncio',
      icon: Sparkles
    }
  ];

  return (
    <section data-section="features" className="py-16 sm:py-20 lg:py-24 xl:py-28 px-3 sm:px-4 bg-camply-blue relative overflow-hidden">
      {/* Floating AI decorations */}
      <div className="absolute top-10 left-10 opacity-10">
        <Cpu className="w-16 h-16 text-white ai-float" />
      </div>
      <div className="absolute bottom-20 right-10 opacity-10">
        <Brain className="w-20 h-20 text-white ai-float-slow" />
      </div>
      <div className="absolute top-1/3 right-1/4 opacity-5">
        <Sparkles className="w-24 h-24 text-white ai-float" />
      </div>
      
      {/* Dot pattern overlay */}
      <div className="absolute inset-0 dot-pattern opacity-10"></div>
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-5 leading-tight px-2">
            Camply entende seu produto e cria anúncios sob medida
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed px-4">
            Com apenas 3 passos simples, você transforma sua ideia em uma campanha profissional
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10 relative">
            {/* Connecting lines */}
            <div className="hidden lg:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-white/20"></div>
            
            {steps.map((step, index) => (
              <div key={index} className="text-center px-2 relative">
                <div className="relative mb-6 sm:mb-8">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-2xl hover:scale-110 transition-transform">
                    <step.icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-camply-blue" />
                  </div>
                  <div className="absolute -top-2 -right-2 sm:-top-3 sm:-right-3 w-10 h-10 sm:w-12 sm:h-12 bg-camply-yellow rounded-full flex items-center justify-center text-lg sm:text-xl font-black text-camply-dark shadow-lg">
                    {step.number}
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 leading-tight">{step.title}</h3>
                <p className="text-white/80 text-base sm:text-lg leading-relaxed">{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12 sm:mt-16">
            <AIWorkflowAnimation />
          </div>
          
          <div className="text-center mt-12 sm:mt-16">
            <div className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 lg:p-12 mx-2 sm:mx-0 shadow-2xl">
              <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 text-camply-green mx-auto mb-4 sm:mb-6" />
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-camply-dark mb-3 sm:mb-4 leading-tight">E pronto!</h3>
              <p className="text-lg sm:text-xl lg:text-2xl text-camply-dark/80 leading-relaxed">
                O Camply transforma isso em uma campanha profissional, com segmentação inteligente e otimização contínua.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
