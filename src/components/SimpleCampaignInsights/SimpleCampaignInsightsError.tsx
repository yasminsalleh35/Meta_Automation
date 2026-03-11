
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SimpleCampaignInsightsErrorProps {
  error: string;
  onRetry: () => void;
}

export const SimpleCampaignInsightsError: React.FC<SimpleCampaignInsightsErrorProps> = ({
  error,
  onRetry
}) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Button variant="ghost" asChild>
            <Link to="/dashboard/simple-campaign-list">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Campanhas
            </Link>
          </Button>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Erro ao carregar insights
            </h3>
            <p className="text-gray-600 mb-6">
              {error || 'Não foi possível carregar os dados de desempenho da campanha.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={onRetry} className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Tentar novamente
              </Button>
              <Button variant="outline" asChild>
                <Link to="/dashboard/simple-campaign-list">
                  Voltar para Campanhas
                </Link>
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Possíveis causas:</h4>
              <ul className="text-sm text-blue-800 text-left list-disc list-inside space-y-1">
                <li>Campanha ainda não possui dados suficientes</li>
                <li>Problemas temporários na conexão com Meta Ads</li>
                <li>Token de acesso da integração expirado</li>
                <li>Campanha pode ter sido removida do Meta Ads</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
