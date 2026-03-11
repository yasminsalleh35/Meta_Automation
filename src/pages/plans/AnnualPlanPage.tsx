import React from 'react';
import { Helmet } from 'react-helmet';
import { Check, Shield, Star, Zap, Headphones, BookOpen, Trophy, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { PlanHeader } from '@/components/plans/PlanHeader';
import { PlanFooter } from '@/components/plans/PlanFooter';
import { useAsaasPublicCheckout } from '@/hooks/useAsaasPublicCheckout';

export default function AnnualPlanPage() {
  const { loading, startCheckout } = useAsaasPublicCheckout();

  const handleSubscribe = () => {
    startCheckout('anual');
  };

  const commonBenefits = [
    {
      icon: Check,
      title: 'Campanhas Ilimitadas',
      description: 'Crie e gerencie quantas campanhas precisar'
    },
    {
      icon: BookOpen,
      title: 'Relatórios Completos',
      description: 'Análises detalhadas em tempo real'
    },
    {
      icon: Headphones,
      title: 'Suporte Especializado',
      description: 'Atendimento prioritário'
    },
    {
      icon: Trophy,
      title: 'Material de Aprendizado',
      description: 'Acesso a conteúdos exclusivos e atualizações'
    }
  ];

  const exclusiveBenefits = [
    {
      icon: Star,
      title: 'Implantação e Setup Incluso',
      description: 'Nossa equipe configura tudo para você começar'
    },
    {
      icon: Rocket,
      title: 'Suporte com Especialista Dedicado',
      description: 'Atendimento prioritário e personalizado'
    },
    {
      icon: Zap,
      title: 'Avaliação de Estratégia de Marketing',
      description: 'Consultoria especializada para maximizar resultados'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Plano Anual Camply - 12x R$ 249,99 sem juros | Economize R$ 1.200</title>
        <meta 
          name="description" 
          content="Apenas R$ 249,99 por mês! Plano Anual com implantação inclusa e suporte especializado. Pague em 12x sem juros. Economize R$ 1.200."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-camply-blue/5">
        <PlanHeader />

        <main className="flex-1 container py-12 md:py-20">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 text-sm font-bold mb-6 border border-yellow-500/30">
              <Star className="w-4 h-4 fill-current" />
              MAIS POPULAR
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary via-camply-blue to-camply-green bg-clip-text text-transparent">
              O Plano Mais Escolhido
              <br />
              pelos Profissionais
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Economize <span className="font-bold text-secondary">R$ 1.200</span> e tenha acesso a benefícios exclusivos
            </p>
          </div>

          {/* Pricing Card - Premium */}
          <Card className="max-w-2xl mx-auto mb-16 border-2 border-primary/50 shadow-2xl hover-scale relative overflow-hidden">
            {/* Shine effect */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-camply-blue to-camply-green"></div>
            
            <CardHeader className="text-center pb-8 pt-10">
              <div className="mb-2">
                <span className="text-lg text-muted-foreground line-through">De R$ 4.199,88</span>
              </div>
              
              <div className="mb-6">
              <div className="text-5xl sm:text-6xl font-extrabold mb-2 bg-gradient-to-r from-primary to-camply-blue bg-clip-text text-transparent">
                12x de R$ 249<span className="text-3xl">,99</span>
              </div>
              <div className="text-muted-foreground mb-4">sem juros no cartão</div>
                
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-bold border border-secondary/30">
                  <Zap className="w-4 h-4" />
                  Economize R$ 1.200
                </div>
              </div>
              
              <Button 
                size="lg" 
                className="w-full max-w-md mx-auto h-14 text-lg font-semibold bg-gradient-to-r from-primary to-camply-blue hover:opacity-90 transition-opacity"
                onClick={handleSubscribe}
                disabled={loading}
              >
                <Zap className="w-5 h-5 mr-2" />
                {loading ? 'Processando...' : 'Garantir Meu Desconto'}
              </Button>
              
              <p className="text-sm text-muted-foreground mt-4">
                Ou <span className="font-semibold">R$ 2.999,99</span> à vista
              </p>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Common Benefits */}
              <div className="border-t pt-8">
                <h3 className="font-semibold text-lg mb-4">Tudo do plano mensal:</h3>
                <div className="grid gap-3">
                  {commonBenefits.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
                        <benefit.icon className="w-5 h-5 text-secondary" />
                      </div>
                      <div>
                        <div className="font-medium mb-1">{benefit.title}</div>
                        <div className="text-sm text-muted-foreground">{benefit.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Exclusive Benefits */}
              <div className="border-t pt-8 bg-gradient-to-br from-yellow-50/50 to-transparent dark:from-yellow-950/20 dark:to-transparent rounded-lg p-6 -mx-6">
                <div className="flex items-center gap-2 mb-4">
                  <Star className="w-5 h-5 text-yellow-600 fill-current" />
                  <h3 className="font-semibold text-lg">Benefícios Exclusivos do Anual:</h3>
                </div>
                <div className="grid gap-4">
                  {exclusiveBenefits.map((benefit, index) => (
                    <div 
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-lg bg-card border-2 border-yellow-200/50 dark:border-yellow-900/50 hover:border-yellow-300 dark:hover:border-yellow-800 transition-colors"
                    >
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
                        <benefit.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="font-semibold mb-1 flex items-center gap-2">
                          {benefit.title}
                          <Star className="w-4 h-4 text-yellow-600 fill-current" />
                        </div>
                        <div className="text-sm text-muted-foreground">{benefit.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trust Badges - Premium */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary" />
                <span>Pagamento Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-yellow-600" />
                <span>Melhor Custo-Benefício</span>
              </div>
              <div className="flex items-center gap-2">
                <Rocket className="w-5 h-5 text-primary" />
                <span>Implantação Inclusa</span>
              </div>
              <div className="flex items-center gap-2">
                <Headphones className="w-5 h-5 text-camply-blue" />
                <span>Suporte Premium</span>
              </div>
            </div>
          </div>
        </main>

        <PlanFooter />
      </div>
    </>
  );
}
