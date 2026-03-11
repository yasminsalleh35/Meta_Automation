import React from 'react';
import { Helmet } from 'react-helmet';
import { Check, Shield, Clock, Headphones, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PlanHeader } from '@/components/plans/PlanHeader';
import { PlanFooter } from '@/components/plans/PlanFooter';
import { useAsaasPublicCheckout } from '@/hooks/useAsaasPublicCheckout';

export default function MonthlyPlanPage() {
  const { loading, startCheckout } = useAsaasPublicCheckout();

  const handleSubscribe = () => {
    startCheckout('mensal');
  };

  const benefits = [
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
      description: 'Atendimento rápido quando precisar'
    },
    {
      icon: Clock,
      title: 'Material de Aprendizado',
      description: 'Acesso a conteúdos exclusivos'
    }
  ];

  return (
    <>
      <Helmet>
        <title>Plano Mensal Camply - R$ 349,99/mês | Flexibilidade Total</title>
        <meta 
          name="description" 
          content="Assine o Plano Mensal do Camply e crie campanhas de alto impacto. Flexibilidade total, cancele quando quiser. Campanhas ilimitadas + suporte especializado."
        />
      </Helmet>

      <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <PlanHeader />

        <main className="flex-1 container py-12 md:py-20">
          {/* Hero Section */}
          <div className="max-w-4xl mx-auto text-center mb-16 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <Clock className="w-4 h-4" />
              Flexibilidade Mensal
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-camply-blue bg-clip-text text-transparent">
              Transforme Suas Campanhas
              <br />
              com o Plano Mensal
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Flexibilidade total para crescer no seu ritmo, sem compromisso de longo prazo
            </p>
          </div>

          {/* Pricing Card */}
          <Card className="max-w-2xl mx-auto mb-16 border-2 hover-scale shadow-xl">
            <CardHeader className="text-center pb-8 pt-10">
              <div className="mb-6">
                <div className="text-5xl sm:text-6xl font-extrabold mb-2">
                  R$ 349<span className="text-3xl">,99</span>
                </div>
                <div className="text-muted-foreground">por mês</div>
              </div>
              
              <Button 
                size="lg" 
                className="w-full max-w-md mx-auto h-14 text-lg font-semibold"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? 'Processando...' : 'Começar Agora'}
              </Button>
              
              <p className="text-sm text-muted-foreground mt-4">
                Cancele quando quiser • Sem fidelidade
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="border-t pt-8">
                <h3 className="font-semibold text-lg mb-4">O que está incluso:</h3>
                <div className="grid gap-4">
                  {benefits.map((benefit, index) => (
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
            </CardContent>
          </Card>

          {/* Trust Badges */}
          <div className="max-w-2xl mx-auto">
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary" />
                <span>Pagamento Seguro</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-secondary" />
                <span>Flexibilidade Total</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-secondary" />
                <span>Cancele Quando Quiser</span>
              </div>
            </div>
          </div>
        </main>

        <PlanFooter />
      </div>
    </>
  );
}
