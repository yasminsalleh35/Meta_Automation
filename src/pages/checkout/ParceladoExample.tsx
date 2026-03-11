import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard, ArrowRight } from 'lucide-react';
import { usePaymentsConfig } from '@/hooks/usePaymentsConfig';
import { Badge } from '@/components/ui/badge';

/**
 * Página de demonstração do fluxo de pagamento parcelado
 * Esta página mostra como integrar os CTAs para o checkout parcelado
 */
export default function ParceladoExample() {
  const { isHybridReady } = usePaymentsConfig();

  const examples = [
    {
      name: "Plano Premium Mensal",
      price: "R$ 349,99",
      amount: 34999, // centavos
      description: "Acesso completo por 1 mês"
    },
    {
      name: "Plano Premium Anual", 
      price: "R$ 2.499,00",
      amount: 249900, // centavos
      description: "Acesso completo por 12 meses - Economize R$ 1.700",
      popular: true
    }
  ];

  const handleParceladoClick = (amount: number, ref: string) => {
    const url = `/checkout/parcelado?amount=${amount}&currency=BRL&ref=${ref}`;
    window.location.href = url;
  };

  if (!isHybridReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-6">
            <CreditCard className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-semibold mb-3">Pagamento Parcelado Indisponível</h2>
            <p className="text-muted-foreground mb-4">
              O método de pagamento parcelado do Pagar.me não está configurado.
            </p>   
            <p className="text-sm text-muted-foreground">
              Configure o Pagar.me no painel administrativo para habilitar esta funcionalidade.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Exemplo: Pagamento Parcelado</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Demonstração do fluxo de checkout parcelado via Pagar.me
          </p>
          <Badge variant="secondary" className="text-sm">
            🎯 Ambiente: TEST
          </Badge>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {examples.map((example, index) => (
            <Card key={index} className={`relative ${example.popular ? 'ring-2 ring-primary' : ''}`}>
              {example.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Mais Popular</Badge>
                </div>
              )}
              
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">{example.name}</CardTitle>
                <div className="text-3xl font-bold text-primary mt-2">{example.price}</div>
                <p className="text-muted-foreground">{example.description}</p>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Features list */}
                <div className="space-y-2 mb-6">
                  <div className="flex items-center text-sm">
                    <CreditCard className="w-4 h-4 mr-2 text-green-500" />
                    Parcele em até 12x no cartão
                  </div>
                  <div className="flex items-center text-sm">
                    <CreditCard className="w-4 h-4 mr-2 text-green-500" />
                    Sem juros até 3x
                  </div>
                  <div className="flex items-center text-sm">
                    <CreditCard className="w-4 h-4 mr-2 text-green-500" />
                    Processamento seguro via Pagar.me
                  </div>
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full py-6 text-lg font-semibold"
                  size="lg" 
                  onClick={() => handleParceladoClick(example.amount, `example_${index}`)}
                >
                  💳 Pagar Parcelado
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>

                {/* Info */}
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">
                    Clique para testar o fluxo completo
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Instructions */}
        <div className="max-w-2xl mx-auto mt-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Como Testar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-semibold">1. Seleção de Parcelas</h4>
                <p className="text-sm text-muted-foreground">
                  Escolha quantas parcelas deseja (1x a 12x) e veja o cálculo dos juros automaticamente.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">2. Dados do Cartão</h4>
                <p className="text-sm text-muted-foreground">
                  Use cartões de teste do Pagar.me para simular diferentes cenários de aprovação/recusa.
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-semibold">3. Processamento</h4>
                <p className="text-sm text-muted-foreground">
                  O pagamento será processado via Pagar.me e você será redirecionado para a página de sucesso.
                </p>
              </div>

              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>💡 Dica:</strong> Este é um ambiente de testes. Nenhum pagamento real será processado.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}