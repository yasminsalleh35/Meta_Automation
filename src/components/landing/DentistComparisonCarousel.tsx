import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { 
  DollarSign, 
  Clock, 
  TrendingUp, 
  Infinity, 
  BarChart3, 
  Headphones, 
  MessageCircle, 
  Shield,
  Award,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const DentistComparisonCarousel: React.FC = () => {
  const comparisons = [
    {
      icon: DollarSign,
      title: "Preço Mensal (Gestão)",
      camply: {
        title: "~R$ 167/mês",
        subtitle: "Plano anual fixo",
        highlight: "Até 10x mais barato"
      },
      gestor: {
        title: "R$ 1.500 a R$ 5.000/mês",
        subtitle: "Valores variáveis"
      },
      agencia: {
        title: "R$ 1.500 a R$ 15.000/mês",
        subtitle: "Contratos caros"
      }
    },
    {
      icon: Clock,
      title: "Criação de Campanhas",
      camply: {
        title: "Em minutos com IA",
        subtitle: "Processo automatizado",
        highlight: "Pronto em 5 minutos"
      },
      gestor: {
        title: "Demora dias",
        subtitle: "Entre briefing e entrega"
      },
      agencia: {
        title: "Processo burocrático",
        subtitle: "Reuniões demoradas"
      }
    },
    {
      icon: TrendingUp,
      title: "Otimização",
      camply: {
        title: "IA 24/7 em tempo real",
        subtitle: "Nunca para de melhorar",
        highlight: "Otimização constante"
      },
      gestor: {
        title: "Depende do gestor",
        subtitle: "Limitada à disponibilidade"
      },
      agencia: {
        title: "Relatórios periódicos",
        subtitle: "Reuniões esporádicas"
      }
    },
    {
      icon: Infinity,
      title: "Quantidade de Campanhas",
      camply: {
        title: "Ilimitadas",
        subtitle: "Crie e pause quando quiser",
        highlight: "Sem limites"
      },
      gestor: {
        title: "Limitadas",
        subtitle: "Pelo escopo contratado"
      },
      agencia: {
        title: "Limitadas",
        subtitle: "Conforme pacote"
      }
    },
    {
      icon: BarChart3,
      title: "Relatórios de Desempenho",
      camply: {
        title: "Visual simples",
        subtitle: "Ruim / Médio / Bom",
        highlight: "Fácil de entender"
      },
      gestor: {
        title: "Relatórios técnicos",
        subtitle: "Complexos e confusos"
      },
      agencia: {
        title: "Nem sempre claros",
        subtitle: "Podem atrasar"
      }
    },
    {
      icon: Headphones,
      title: "Suporte na Configuração",
      camply: {
        title: "Acompanhamento total",
        subtitle: "Do início ao fim",
        highlight: "Suporte dedicado"
      },
      gestor: {
        title: "Pode ter demora",
        subtitle: "Depende do profissional"
      },
      agencia: {
        title: "Via tickets",
        subtitle: "Reuniões mensais"
      }
    },
    {
      icon: MessageCircle,
      title: "Destino dos Anúncios",
      camply: {
        title: "WhatsApp direto",
        subtitle: "Da sua clínica",
        highlight: "Contato imediato"
      },
      gestor: {
        title: "Pode variar",
        subtitle: "Costuma exigir landing page"
      },
      agencia: {
        title: "Páginas externas",
        subtitle: "Redirecionamentos"
      }
    },
    {
      icon: Shield,
      title: "Controle da Campanha",
      camply: {
        title: "Completo, 24h",
        subtitle: "Você tem total controle",
        highlight: "Controle total"
      },
      gestor: {
        title: "Parcial",
        subtitle: "Depende do gestor"
      },
      agencia: {
        title: "Limitado",
        subtitle: "Ao escopo do contrato"
      }
    }
  ];

  return (
    <section className="py-16 sm:py-20 px-4 bg-white">
      <div className="container-responsive">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="heading-responsive font-bold text-gray-900 mb-6 sm:mb-8">
            Camply x Gestor de Tráfego x Agência de Marketing
          </h2>
          <p className="text-responsive text-gray-600 mb-4">
            Por que Camply é a escolha mais inteligente para dentistas
          </p>
          <p className="text-sm text-muted-foreground">
            Deslize para descobrir todas as vantagens
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <Carousel
            opts={{
              align: "center",
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent className="-ml-2 md:-ml-4">
              {comparisons.map((comparison, index) => (
                <CarouselItem key={index} className="pl-2 md:pl-4 basis-full">
                  <Card className="bg-card rounded-2xl shadow-xl border border-border h-full">
                    {/* Header */}
                    <div className="text-center p-6 pb-4 border-b border-border">
                      <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <comparison.icon className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl md:text-2xl font-bold text-foreground">
                        {comparison.title}
                      </h3>
                    </div>

                    {/* Comparison Cards */}
                    <CardContent className="p-6 space-y-4">
                      {/* Camply - Winner */}
                      <div className="bg-gradient-to-r from-primary/5 to-primary/10 p-6 rounded-xl border-2 border-primary/20 relative">
                        <div className="absolute top-3 right-3">
                          <div className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                            <Award className="w-3 h-3" />
                            MELHOR
                          </div>
                        </div>
                        <div className="flex items-center mb-3">
                          <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center mr-3">
                            <span className="text-primary-foreground text-sm font-bold">✓</span>
                          </div>
                          <span className="font-bold text-primary text-lg">Camply (IA)</span>
                        </div>
                        <h4 className="font-bold text-foreground text-xl mb-2">
                          {comparison.camply.title}
                        </h4>
                        <p className="text-muted-foreground mb-3">
                          {comparison.camply.subtitle}
                        </p>
                        {comparison.camply.highlight && (
                          <Badge className="bg-primary/10 text-primary text-sm font-semibold px-3 py-1 rounded-full">
                            ✨ {comparison.camply.highlight}
                          </Badge>
                        )}
                      </div>

                      {/* Gestor de Tráfego */}
                      <div className="bg-muted/50 p-5 rounded-lg border border-border">
                        <div className="flex items-center mb-2">
                          <div className="w-5 h-5 bg-muted-foreground/20 rounded-full mr-3 flex items-center justify-center">
                            <span className="text-muted-foreground text-xs font-bold">–</span>
                          </div>
                          <span className="font-semibold text-muted-foreground">Gestor de Tráfego</span>
                        </div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {comparison.gestor.title}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {comparison.gestor.subtitle}
                        </p>
                      </div>

                      {/* Agência */}
                      <div className="bg-muted/50 p-5 rounded-lg border border-border">
                        <div className="flex items-center mb-2">
                          <div className="w-5 h-5 bg-destructive/20 rounded-full mr-3 flex items-center justify-center">
                            <span className="text-destructive text-xs font-bold">✗</span>
                          </div>
                          <span className="font-semibold text-muted-foreground">Agência</span>
                        </div>
                        <h4 className="font-semibold text-foreground mb-1">
                          {comparison.agencia.title}
                        </h4>
                        <p className="text-muted-foreground text-sm">
                          {comparison.agencia.subtitle}
                        </p>
                      </div>
                    </CardContent>

                    {/* Card Footer */}
                    <div className="text-center py-4 px-6 border-t border-border">
                      <span className="text-sm text-muted-foreground">
                        {index + 1} de {comparisons.length}
                      </span>
                    </div>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            
            <CarouselPrevious className="hidden md:flex -left-12 hover:bg-primary hover:text-primary-foreground transition-colors" />
            <CarouselNext className="hidden md:flex -right-12 hover:bg-primary hover:text-primary-foreground transition-colors" />
          </Carousel>

          {/* Mobile Navigation Hint */}
          <div className="text-center mt-6 md:hidden">
            <p className="text-sm text-muted-foreground flex items-center justify-center">
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