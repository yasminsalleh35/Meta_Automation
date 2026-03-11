import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Sparkles, Target, BarChart3 } from 'lucide-react';

const Welcome: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleContinue = () => {
    navigate('/onboarding/plan-selection');
  };

  const features = [
    {
      icon: Target,
      title: "Campanhas Inteligentes",
      description: "IA otimiza seus anúncios automaticamente para máximo ROI"
    },
    {
      icon: BarChart3,
      title: "Análises em Tempo Real",
      description: "Dashboards completos com métricas que realmente importam"
    },
    {
      icon: Sparkles,
      title: "Setup Automático",
      description: "Configure campanhas profissionais em menos de 5 minutos"
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-camply-blue"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-camply-blue via-blue-500 to-camply-green flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white/95 backdrop-blur-xl border-0 shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Welcome Header */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-camply-yellow to-camply-green rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Bem-vindo ao Camply, {user?.name || 'Gestor'}! 🎉
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Sua conta foi criada com sucesso. Agora vamos configurar 
              sua experiência personalizada para maximizar seus resultados.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-12 h-12 bg-camply-blue/10 rounded-xl flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="w-6 h-6 text-camply-blue" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Trial Badge */}
          <div className="bg-gradient-to-r from-camply-yellow/20 to-camply-green/20 rounded-2xl p-6 mb-8 border border-camply-yellow/30">
            <div className="flex items-center justify-center mb-3">
              <Sparkles className="w-5 h-5 text-camply-yellow mr-2" />
              <span className="font-semibold text-gray-900">14 Dias Grátis</span>
            </div>
            <p className="text-sm text-gray-700">
              Experimente todos os recursos premium sem compromisso. 
              Cancele quando quiser, sem taxas.
            </p>
          </div>

          {/* Continue Button */}
          <Button 
            onClick={handleContinue}
            className="w-full h-12 bg-gradient-to-r from-camply-blue to-camply-green hover:from-camply-blue/90 hover:to-camply-green/90 text-white font-semibold text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg group"
          >
            <span>Começar Meu Trial Gratuito</span>
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Button>

          <p className="text-xs text-gray-500 mt-4">
            Sem cartão de crédito necessário • Cancele a qualquer momento
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Welcome;