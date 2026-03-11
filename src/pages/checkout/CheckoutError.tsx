import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft } from 'lucide-react';

export default function CheckoutError() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const message = searchParams.get('message') || 'Ocorreu um erro ao processar seu pagamento.';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full p-8 text-center">
        <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
          <XCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>
        
        <h1 className="text-2xl font-bold mb-4">Erro no Pagamento</h1>
        
        <div className="space-y-4 text-muted-foreground">
          <p className="text-foreground">
            {message}
          </p>
          
          <p className="text-sm">
            Por favor, verifique seus dados e tente novamente. Se o problema persistir, 
            entre em contato com nosso suporte.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-3">
          <Button onClick={() => navigate(-1)} size="lg">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tentar Novamente
          </Button>
          
          <Button 
            variant="outline" 
            onClick={() => navigate('/assinatura')}
          >
            Ver Outros Planos
          </Button>

          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
          >
            Voltar para Home
          </Button>
        </div>
      </Card>
    </div>
  );
}
