import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SubscriptionSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
      <div className="container mx-auto px-4">
        <Card className="max-w-2xl mx-auto p-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="h-20 w-20 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>

          <h1 className="text-3xl font-bold mb-4">Assinatura Criada com Sucesso!</h1>
          
          <p className="text-lg text-muted-foreground mb-6">
            Seu pagamento está sendo processado. Você receberá um e-mail de confirmação em breve.
          </p>

          <div className="bg-muted/50 rounded-lg p-6 mb-8">
            <Mail className="h-8 w-8 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Verifique seu E-mail</h3>
            <p className="text-sm text-muted-foreground">
              Enviamos instruções para você criar sua senha e acessar sua conta.
              Caso não encontre o e-mail, verifique sua caixa de spam.
            </p>
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate('/dashboard')}
              size="lg"
              className="w-full"
            >
              Ir para o Dashboard
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <Button
              onClick={() => navigate('/')}
              variant="outline"
              size="lg"
              className="w-full"
            >
              Voltar para a Página Inicial
            </Button>
          </div>

          <div className="mt-8 pt-6 border-t text-sm text-muted-foreground">
            <p>
              Tem dúvidas? Entre em contato conosco através do suporte
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
