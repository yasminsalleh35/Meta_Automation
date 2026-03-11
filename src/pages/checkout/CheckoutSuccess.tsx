import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Mail, CreditCard } from 'lucide-react';

export default function CheckoutSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const provider = searchParams.get('provider');
  const env = searchParams.get('env');
  const planName = searchParams.get('plan');

  // Check if it's an Asaas test checkout
  const isAsaasTest = provider === 'asaas';
  const environmentLabel = env === 'production' ? 'Produção' : 'Sandbox';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full p-8 shadow-xl border-primary/20">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="rounded-full bg-primary/10 p-6">
              <CheckCircle className="w-16 h-16 text-primary" />
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-bold">
              {isAsaasTest ? 'Checkout de Teste Criado!' : 'Pagamento Confirmado!'}
            </h1>
            <p className="text-muted-foreground text-lg">
              {isAsaasTest 
                ? `Pagamento de teste via Asaas (${environmentLabel})`
                : 'Sua assinatura foi criada com sucesso e está sendo processada'
              }
            </p>
          </div>

          {isAsaasTest && planName && (
            <div className="bg-primary/5 rounded-lg p-4 space-y-2">
              <div className="flex items-center justify-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">{decodeURIComponent(planName)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Este é um checkout de teste. {env === 'production' ? 'Atenção: Ambiente de produção!' : 'Use os cartões de teste do Asaas.'}
              </p>
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-6 space-y-3">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Mail className="w-4 h-4" />
              <span>
                {isAsaasTest 
                  ? 'O webhook será processado após a confirmação do pagamento'
                  : 'Assim que o pagamento for confirmado, você receberá um e-mail com instruções para criar sua senha e acessar a plataforma'
                }
              </span>
            </div>
            {!isAsaasTest && (
              <p className="text-sm text-muted-foreground">
                Verifique sua caixa de entrada (e spam) nos próximos minutos
              </p>
            )}
          </div>

          <div className="pt-4 space-y-3">
            {isAsaasTest ? (
              <>
                <Button 
                  onClick={() => navigate('/admin/integrations/asaas')} 
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  Voltar para Admin Asaas
                </Button>
                <p className="text-xs text-muted-foreground">
                  Você pode verificar os logs dos webhooks na área administrativa
                </p>
              </>
            ) : (
              <div className="flex flex-col gap-3">
                <Button onClick={() => navigate('/')} size="lg">
                  Voltar para Home
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/assinatura')}
                >
                  Ver Planos
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
