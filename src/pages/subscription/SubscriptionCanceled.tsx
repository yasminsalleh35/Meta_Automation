import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionCanceled() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-orange-100 flex items-center justify-center">
              <XCircle className="h-12 w-12 text-orange-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">Pagamento Cancelado</h1>
          
          <p className="text-lg text-muted-foreground mb-8">
            O processo de pagamento foi interrompido. Nenhuma cobrança foi realizada.
          </p>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/assinatura')}
              size="lg"
              className="w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar aos Planos
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Ir para a Página Inicial
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
            <p>
              Precisa de ajuda? Entre em contato com nosso suporte
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
