import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  ArrowRight, 
  Facebook, 
  Instagram,
  Target,
  TrendingUp,
  Sparkles
} from 'lucide-react';
import { useMetaAdsConnection } from '@/hooks/meta-ads/useMetaAdsConnection';

const MetaIntegrationSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { connection, integration } = useMetaAdsConnection();
  const [showConfetti, setShowConfetti] = useState(false);

  // Get integration details from URL params or connection
  const adAccountName = searchParams.get('ad_account') || 'Conta de Anúncios';
  const pageName = searchParams.get('page') || 'Página Facebook';
  const instagramName = searchParams.get('instagram') || null;

  useEffect(() => {
    // Show confetti animation
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  // If no connection, redirect to integrations
  useEffect(() => {
    if (!connection.isConnected) {
      navigate('/dashboard/integrations');
    }
  }, [connection.isConnected, navigate]);

  const handleCreateCampaign = () => {
    navigate('/dashboard/simple-campaign-wizard');
  };

  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  const nextSteps = [
    "Criar sua primeira campanha publicitária",
    "Configurar públicos-alvo personalizados",
    "Analisar métricas e resultados",
    "Otimizar campanhas com IA",
    "Escalar resultados positivos"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full bg-white border-0 shadow-2xl">
        <CardContent className="p-8 text-center">
          {/* Success Animation */}
          <div className="mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center">
                <Facebook className="w-4 h-4 text-white" />
              </div>
              {showConfetti && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-yellow-400 animate-spin" />
                </div>
              )}
            </div>
            
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎉 Meta Ads Integrado!
            </h1>
            
            <p className="text-lg text-gray-600 mb-6">
              Sua conta Meta Ads foi conectada com sucesso. Agora você pode criar campanhas poderosas e automatizadas!
            </p>
          </div>

          {/* Integration Status */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 mb-8 border border-blue-200">
            <div className="flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-blue-600 mr-3" />
              <span className="text-lg font-semibold text-gray-900">
                Integração Ativa
              </span>
            </div>
            
            {/* Connected Assets */}
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center">
                  <Target className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="font-medium">Conta de Anúncios</span>
                </div>
                <span className="text-gray-600">{adAccountName}</span>
              </div>
              
              <div className="flex items-center justify-between bg-white rounded-lg p-3">
                <div className="flex items-center">
                  <Facebook className="w-4 h-4 text-blue-600 mr-2" />
                  <span className="font-medium">Página Facebook</span>
                </div>
                <span className="text-gray-600">{pageName}</span>
              </div>
              
              {instagramName && (
                <div className="flex items-center justify-between bg-white rounded-lg p-3">
                  <div className="flex items-center">
                    <Instagram className="w-4 h-4 text-purple-500 mr-2" />
                    <span className="font-medium">Instagram</span>
                  </div>
                  <span className="text-gray-600">{instagramName}</span>
                </div>
              )}
            </div>
          </div>

          {/* What's Next */}
          <div className="text-left mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center flex items-center justify-center">
              <TrendingUp className="w-5 h-5 mr-2" />
              Próximos Passos
            </h3>
            <div className="grid gap-3">
              {nextSteps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">{index + 1}</span>
                  </div>
                  <span className="text-gray-700">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro Tip */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4 mb-8 border border-yellow-200">
            <p className="text-sm text-gray-800">
              <strong>💡 Dica Pro:</strong> Comece com campanhas simples e use nossa IA para otimizar automaticamente conforme você ganha experiência!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            <Button 
              onClick={handleCreateCampaign}
              className="w-full h-12 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] shadow-lg group"
            >
              <Target className="mr-2 h-4 w-4" />
              <span>Criar Minha Primeira Campanha</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <Button 
              onClick={handleGoToDashboard}
              variant="outline"
              className="w-full h-12 border-2 border-gray-300 hover:border-blue-400 text-gray-700 hover:text-blue-600 font-medium text-base rounded-xl transition-all duration-200 transform hover:scale-[1.02] group"
            >
              <span>Ir para o Dashboard</span>
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>

            <div className="text-center pt-4">
              <button
                onClick={() => navigate('/dashboard/integrations')}
                className="text-sm text-gray-500 hover:text-blue-600 underline"
              >
                Configurar Mais Integrações
              </button>
            </div>
          </div>

          {/* Help Section */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Precisa de ajuda com suas campanhas? 
              <br />
              <a href="/dashboard/support" className="text-blue-600 hover:underline ml-1">
                Acesse nosso suporte
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MetaIntegrationSuccess;