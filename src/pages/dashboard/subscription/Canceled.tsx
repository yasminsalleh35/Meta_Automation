
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw } from 'lucide-react';

const SubscriptionCanceled: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Pagamento Cancelado
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              O processo de pagamento foi cancelado. Nenhuma cobrança foi realizada.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-blue-700">
                💡 <strong>Dica:</strong> Você pode tentar novamente a qualquer momento. 
                Nossos planos foram criados para se adequar às suas necessidades.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/dashboard/subscription')}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Tentar Novamente
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Precisa de ajuda? Entre em contato com nosso suporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionCanceled;
