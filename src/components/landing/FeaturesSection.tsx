
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Brain, Zap, Shield, Lightbulb } from 'lucide-react';
import { ResponsiveGrid } from '@/components/ui/responsive-grid';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: 'IA Especializada',
      description: 'Inteligência Artificial treinada exclusivamente para performance em anúncios'
    },
    {
      icon: Zap,
      title: 'Configuração Rápida',
      description: 'Campanha ativa em minutos, não em dias ou semanas'
    },
    {
      icon: Shield,
      title: 'Sem Desperdício',
      description: 'Otimização automática 24h evita campanhas mal configuradas'
    },
    {
      icon: Lightbulb,
      title: 'Totalmente Intuitivo',
      description: 'Não precisa ser expert nem contratar agência'
    }
  ];

  return (
    <section className="py-16 sm:py-20 lg:py-24 xl:py-28 px-3 sm:px-4 bg-camply-green-light relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-20 right-10 w-32 h-32 bg-camply-green/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 left-10 w-40 h-40 bg-camply-blue/10 rounded-full blur-3xl"></div>
      
      <div className="container mx-auto relative">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-camply-dark mb-4 sm:mb-5 leading-tight px-2">
            Personalização real com IA especializada
          </h2>
          <p className="text-lg sm:text-xl lg:text-2xl text-camply-dark/70 max-w-3xl mx-auto leading-relaxed px-4">
            IA treinada exclusivamente para entender o seu negócio e gerar anúncios que falam direto com o seu cliente ideal
          </p>
        </div>
        
        <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 4 }} gap={4} className="sm:gap-6">
          {features.map((feature, index) => (
            <Card key={index} className="text-center hover:shadow-2xl transition-all duration-300 border-0 shadow-xl hover:scale-105 bg-white mx-2 sm:mx-0 group">
              <CardHeader className="pb-4 sm:pb-5 pt-6 sm:pt-8">
                <div className="mx-auto w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 bg-camply-blue rounded-2xl flex items-center justify-center mb-4 sm:mb-5 shadow-lg group-hover:scale-110 transition-transform">
                  <feature.icon className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" />
                </div>
                <CardTitle className="text-xl sm:text-2xl text-camply-dark leading-tight px-2">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-6 sm:pb-8">
                <CardDescription className="text-camply-dark/70 text-base sm:text-lg leading-relaxed px-2">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </ResponsiveGrid>
        
        <div className="text-center mt-12 sm:mt-16 px-4">
          <div className="inline-block bg-white px-8 py-6 rounded-2xl shadow-lg border-l-4 border-camply-blue">
            <p className="text-lg sm:text-xl lg:text-2xl text-camply-dark mb-0 leading-relaxed">
              <strong className="text-camply-blue">Você tem total controle</strong> — e ainda recebe relatórios automáticos com análises e sugestões de melhoria.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
