import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';
import { usePagarmeCheckoutContext } from '@/contexts/PagarmeCheckoutContext';
import { usePaymentsConfig } from '@/hooks/usePaymentsConfig';

/**
 * Exemplo de como usar o fluxo Pagar.me parcelado
 * Este componente demonstra como iniciar o checkout parcelado
 */
export const PagarmeCheckoutExample: React.FC = () => {
  const { startPagarmeParcelado, loading } = usePagarmeCheckoutContext();
  const { config } = usePaymentsConfig();

  const handleCheckout = async () => {
    await startPagarmeParcelado({
      amount: 10000, // R$ 100,00 em centavos
      currency: 'BRL',
      metadata: {
        product: 'test_product',
        source: 'checkout_example'
      }
    });
  };

  if (!config?.pagarme?.stripe_custom_payment_method_id) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">
            Pagar.me não configurado. Configure no Admin primeiro.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Teste Pagar.me Parcelado
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-muted-foreground">
          <p>Valor: R$ 100,00</p>
          <p>Parcelas: até {config.pagarme.installments_max}x</p>
          <p>Sem juros: até {config.pagarme.free_installments}x</p>
        </div>
        
        <Button 
          onClick={handleCheckout} 
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Processando...' : 'Pagar com Cartão Parcelado'}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          ✅ Fluxo completo: Parcelas → Cartão → Tokenização → Backend → Webhook
        </p>
      </CardContent>
    </Card>
  );
};