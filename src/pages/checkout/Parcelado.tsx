import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { PaymentElement, useElements } from '@stripe/react-stripe-js';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard } from 'lucide-react';
import { usePaymentsConfig } from '@/hooks/usePaymentsConfig';
import { usePagarmeCheckoutContext } from '@/contexts/PagarmeCheckoutContext';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function CheckoutParcelado() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const elements = useElements();
  const { config, isHybridReady } = usePaymentsConfig();
  const { startPagarmeParcelado, loading } = usePagarmeCheckoutContext();
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentElementReady, setPaymentElementReady] = useState(false);

  // Parse URL params - including guest data
  const amount = parseInt(searchParams.get('amount') || '0');
  const currency = searchParams.get('currency') || 'BRL';
  const ref = searchParams.get('ref') || '';
  
  // Guest checkout data
  const guestName = searchParams.get('guest_name') || '';
  const guestEmail = searchParams.get('guest_email') || '';
  const guestWhatsapp = searchParams.get('guest_whatsapp') || '';
  const planType = searchParams.get('plan_type') || '';
  const billingPeriod = searchParams.get('billing_period') || '';
  
  const isGuestCheckout = !!(guestName && guestEmail);

  useEffect(() => {
    console.log('[cpmt-handler] Parcelado page loaded', { amount, currency, ref, isHybridReady });
    
    // Validar parâmetros
    if (!amount || amount <= 0) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Valor inválido para pagamento"
      });
      navigate('/');
      return;
    }

    if (!isHybridReady) {
      toast({
        variant: "destructive", 
        title: "Pagamento parcelado indisponível",
        description: "Configure o Pagar.me no painel administrativo"
      });
      navigate('/');
      return;
    }
  }, [amount, currency, isHybridReady, navigate, toast]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!elements || !isHybridReady) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Sistema de pagamento não está pronto"
      });
      return;
    }

    setIsSubmitting(true);
    console.log('[cpmt-handler] Starting payment submission');

    try {
      // Submit elements para obter selectedPaymentMethod
      const result = await elements.submit();
      
      if (result.error) {
        console.error('[cpmt-handler] Elements submit error:', result.error);
        toast({
          variant: "destructive",
          title: "Erro na validação",
          description: result.error.message || "Verifique os dados do pagamento"
        });
        return;
      }

      const selectedPaymentMethod = 'selectedPaymentMethod' in result ? result.selectedPaymentMethod : null;
      console.log('[cpmt-handler] Selected payment method:', selectedPaymentMethod);

      // Verificar se é o método personalizado do Pagar.me
      if (selectedPaymentMethod && 
          selectedPaymentMethod === config?.pagarme?.stripe_custom_payment_method_id) {
        
        console.log('[cpmt-handler] Custom payment method selected, starting Pagar.me flow');
        
        // Disparar fluxo Pagar.me
        await startPagarmeParcelado({
          amount,
          currency,
          metadata: {
            source: 'parcelado_page',
            ref: ref || '',
            cpmt_id: selectedPaymentMethod,
            // Include guest data if present
            ...(isGuestCheckout && {
              guest_checkout: 'true',
              guest_name: guestName,
              guest_email: guestEmail,
              guest_whatsapp: guestWhatsapp,
              plan_type: planType,
              billing_period: billingPeriod
            })
          }
        });

      } else {
        // Método não suportado nesta página
        toast({
          variant: "destructive",
          title: "Método não suportado",
          description: "Esta página é exclusiva para pagamento parcelado com Pagar.me"
        });
      }

    } catch (error: any) {
      console.error('[cpmt-handler] Payment submission error:', error);
      toast({
        variant: "destructive",
        title: "Erro no pagamento",
        description: error.message || "Tente novamente em alguns instantes"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value / 100);
  };

  if (!isHybridReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <Alert>
              <AlertDescription>
                Pagamento parcelado indisponível. Entre em contato com o suporte.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Pagamento Parcelado</h1>
            <p className="text-muted-foreground">
              Pague com cartão de crédito em até {config?.pagarme?.installments_max || 12}x
            </p>
            {isGuestCheckout && (
              <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                <p className="text-sm">
                  <strong>Olá, {guestName}!</strong> Após o pagamento, você receberá um email em{' '}
                  <strong>{guestEmail}</strong> para criar sua senha e acessar sua conta.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Card */}
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CreditCard className="w-12 h-12 text-primary" />
              </div>
              <CardTitle>Valor: {formatCurrency(amount)}</CardTitle>
              <CardDescription>
                Parcelamento sem juros até {config?.pagarme?.free_installments || 1}x • 
                Juros de {config?.pagarme?.interest_rate || 0}% ao mês nas demais parcelas
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Payment Element */}
                <div className="min-h-[200px]">
                  <PaymentElement
                    onReady={() => {
                      console.log('[cpmt-handler] PaymentElement ready');
                      setPaymentElementReady(true);
                    }}
                    options={{
                      layout: 'tabs'
                    }}
                  />
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={!paymentElementReady || isSubmitting || loading}
                >
                  {isSubmitting || loading ? (
                    'Processando...'
                  ) : (
                    `Pagar ${formatCurrency(amount)} Parcelado`
                  )}
                </Button>

                {/* Info */}
                <div className="text-center text-sm text-muted-foreground">
                  <p>
                    ✅ Pagamento 100% seguro processado pelo Pagar.me
                  </p>
                  <p>
                    🔒 Seus dados estão protegidos com criptografia SSL
                  </p>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}