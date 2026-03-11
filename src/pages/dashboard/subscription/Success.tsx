
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, ArrowRight, RefreshCw } from 'lucide-react';
import { useSubscription } from '@/hooks/useSubscription';
import { useToast } from '@/hooks/use-toast';

const SubscriptionSuccess: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { checkSubscription, subscription } = useSubscription();
  const { toast } = useToast();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyPayment = async () => {
      try {
        await checkSubscription();
        toast({
          title: "Pagamento confirmado!",
          description: "Sua assinatura foi ativada com sucesso.",
        });
      } catch (error) {
        toast({
          title: "Erro na verificação",
          description: "Houve um problema ao verificar seu pagamento. Tente novamente.",
          variant: "destructive"
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [checkSubscription, toast]);

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-lg w-full">
          <CardContent className="text-center p-8">
            <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Verificando seu pagamento...
            </h2>
            <p className="text-gray-600">
              Aguarde enquanto confirmamos sua assinatura.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-gray-900">
            Pagamento Confirmado!
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div>
            <p className="text-gray-600 mb-4">
              Sua assinatura foi ativada com sucesso. Agora você tem acesso a todos os recursos do Camply!
            </p>
            
            {subscription?.subscribed && (
              <div className="bg-green-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Badge className="bg-green-500 text-white">
                    Plano {subscription.subscription_tier || 'Ativo'}
                  </Badge>
                </div>
                {subscription.subscription_end && (
                  <p className="text-sm text-green-700">
                    Renovação em: {new Date(subscription.subscription_end).toLocaleDateString('pt-BR')}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate('/dashboard')}
              className="w-full"
              size="lg"
            >
              Ir para o Dashboard
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/dashboard/subscription')}
              className="w-full"
            >
              Gerenciar Assinatura
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-sm text-gray-500">
              Em caso de dúvidas, entre em contato com nosso suporte.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubscriptionSuccess;
