
import React from 'react';
import { Sparkles, ChevronLeft, ChevronRight, DollarSign, Zap, Clock, Smile } from 'lucide-react';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';

export const ComparisonTable: React.FC = () => {
  const comparisons = [
    {
      title: 'Facilidade de Uso',
      icon: Smile,
      camply: {
        title: 'Totalmente intuitivo',
        subtitle: 'Interface simples e clara',
        highlight: 'Qualquer pessoa consegue usar'
      },
      gestor: {
        title: 'Complexo para iniciantes',
        subtitle: 'Curva de aprendizado alta'
      },
      agencia: {
        title: 'Depende de reuniões',
        subtitle: 'Comunicação constante necessária'
      }
    },
    {
      title: 'Custo Mensal',
      icon: DollarSign,
      camply: {
        title: 'R$ 397,99',
        subtitle: 'Melhor custo-benefício',
        highlight: 'Até 5x mais barato'
      },
      gestor: {
        title: 'A partir de R$ 1.200',
        subtitle: '3x mais caro'
      },
      agencia: {
        title: 'A partir de R$ 2.000',
        subtitle: '5x mais caro'
      }
    },
    {
      title: 'Otimização',
      icon: Zap,
      camply: {
        title: 'Automática com IA',
        subtitle: '24h por dia trabalhando',
        highlight: 'Nunca para de otimizar'
      },
      gestor: {
        title: 'Manual (sujeita a erros)',
        subtitle: 'Limitada ao tempo humano'
      },
      agencia: {
        title: 'Demora na tomada de decisões',
        subtitle: 'Processos burocráticos'
      }
    },
    {
      title: 'Velocidade de Execução',
      icon: Clock,
      camply: {
        title: 'Campanha ativa em minutos',
        subtitle: 'Deploy instantâneo',
        highlight: 'Resultados imediatos'
      },
      gestor: {
        title: 'Leva dias para executar',
        subtitle: 'Processo manual demorado'
      },
      agencia: {
        title: 'Leva semanas',
        subtitle: 'Aprovações e burocracias'
      }
    }
  ];

  return (
    <section className="py-12 sm:py-16 lg:py-20 xl:py-24 px-3 sm:px-4 bg-camply-light relative">
      {/* Pattern background */}
      <div className="absolute inset-0 grid-pattern opacity-30"></div>
      
      <div className="container mx-auto relative">
        <div className="text-center mb-10 sm:mb-14">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-camply-dark mb-4 px-2">
            Veja o comparativo:
          </h2>
          <p className="text-lg sm:text-xl text-camply-dark/70 max-w-2xl mx-auto">
            Deslize para descobrir por que o Camply é a melhor escolha para seu consultório
          </p>
        </div>
        
        <div className="max-w-5xl mx-auto">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {comparisons.map((comparison, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-full md:basis-4/5 lg:basis-3/4">
                  <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl p-6 md:p-10 border-2 border-camply-blue/20 hover:border-camply-green/40 transition-all">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-camply-blue rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
                        <comparison.icon className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-bold text-camply-dark mb-2">
                        {comparison.title}
                      </h3>
                    </div>

                    {/* Comparison Cards */}
                    <div className="space-y-4">
                      {/* Camply - Winner */}
                      <div className="bg-camply-green-light p-6 rounded-2xl border-2 border-camply-green relative overflow-hidden shadow-lg hover:shadow-xl transition-all">
                        <div className="absolute top-3 right-3">
                          <div className="bg-camply-green text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
                            MELHOR
                          </div>
                        </div>
                        <div className="flex items-center mb-3">
                          <Sparkles className="w-6 h-6 mr-3 text-camply-blue" />
                          <span className="font-bold text-camply-blue text-xl">Camply (IA)</span>
                        </div>
                        <h4 className="font-bold text-camply-dark text-xl mb-2">
                          {comparison.camply.title}
                        </h4>
                        <p className="text-camply-dark/70 mb-3">
                          {comparison.camply.subtitle}
                        </p>
                        {comparison.camply.highlight && (
                          <div className="bg-camply-yellow text-camply-dark text-sm font-bold px-4 py-2 rounded-full inline-block shadow-md">
                            ✨ {comparison.camply.highlight}
                          </div>
                        )}
                      </div>

                      {/* Gestor de Tráfego */}
                      <div className="bg-gray-100/70 backdrop-blur-sm p-5 rounded-xl border border-gray-300/50">
                        <div className="flex items-center mb-2">
                          <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
                          <span className="font-semibold text-gray-600">Gestor de Tráfego</span>
                        </div>
                        <h4 className="font-semibold text-camply-dark mb-1">
                          {comparison.gestor.title}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          {comparison.gestor.subtitle}
                        </p>
                      </div>

                      {/* Agência */}
                      <div className="bg-gray-100/70 backdrop-blur-sm p-5 rounded-xl border border-gray-300/50">
                        <div className="flex items-center mb-2">
                          <div className="w-4 h-4 bg-gray-400 rounded-full mr-3"></div>
                          <span className="font-semibold text-gray-600">Agência</span>
                        </div>
                        <h4 className="font-semibold text-camply-dark mb-1">
                          {comparison.agencia.title}
                        </h4>
                        <p className="text-gray-600 text-sm">
                          {comparison.agencia.subtitle}
                        </p>
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="text-center mt-6 pt-4 border-t border-gray-200">
                      <span className="text-sm text-gray-500 font-medium">
                        {index + 1} de {comparisons.length}
                      </span>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <CarouselPrevious className="hidden md:flex -left-12 hover:bg-camply-blue hover:text-white transition-colors shadow-lg border-2 border-camply-blue/20" />
            <CarouselNext className="hidden md:flex -right-12 hover:bg-camply-blue hover:text-white transition-colors shadow-lg border-2 border-camply-blue/20" />
          </Carousel>

          {/* Mobile Navigation Hint */}
          <div className="text-center mt-6 md:hidden">
            <p className="text-sm text-camply-dark/60 flex items-center justify-center font-medium">
              <ChevronLeft className="w-4 h-4 mr-1" />
              Deslize para ver mais comparações
              <ChevronRight className="w-4 h-4 ml-1" />
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
