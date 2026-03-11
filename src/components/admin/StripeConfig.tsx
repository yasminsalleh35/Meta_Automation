
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { CreditCard, Save, TestTube, AlertCircle } from 'lucide-react';

interface PlanConfig {
  basic: number;
  top: number;
  premium: number;
}

const StripeConfig: React.FC = () => {
  const { toast } = useToast();
  const [prices, setPrices] = useState<PlanConfig>({
    basic: 97,
    top: 197,
    premium: 397
  });
  const [isTestMode, setIsTestMode] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const handlePriceChange = (plan: keyof PlanConfig, value: string) => {
    const numericValue = parseFloat(value) || 0;
    setPrices(prev => ({
      ...prev,
      [plan]: numericValue
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Here you could save to Supabase or local storage
      // For now, we'll just show a success message
      toast({
        title: "Configurações salvas!",
        description: "Os preços dos planos foram atualizados com sucesso.",
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as configurações.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <CreditCard className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Configuração Stripe</h1>
          <p className="text-gray-600">Configure os preços e configurações dos planos</p>
        </div>
      </div>

      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>Status da Configuração</span>
            <Badge variant={isTestMode ? "secondary" : "default"}>
              {isTestMode ? "Modo Teste" : "Modo Produção"}
            </Badge>
          </CardTitle>
          <CardDescription>
            Configure os preços dos planos de assinatura
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Price Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Preços</CardTitle>
          <CardDescription>
            Defina os preços mensais para cada plano de assinatura
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic Plan */}
            <div className="space-y-2">
              <Label htmlFor="basic-price">Plano Básico</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <Input
                  id="basic-price"
                  type="number"
                  value={prices.basic}
                  onChange={(e) => handlePriceChange('basic', e.target.value)}
                  className="pl-10"
                  placeholder="97.00"
                />
              </div>
              <p className="text-sm text-gray-500">
                Atual: {formatPrice(prices.basic)}/mês
              </p>
            </div>

            {/* Top Plan */}
            <div className="space-y-2">
              <Label htmlFor="top-price">Plano Top</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <Input
                  id="top-price"
                  type="number"
                  value={prices.top}
                  onChange={(e) => handlePriceChange('top', e.target.value)}
                  className="pl-10"
                  placeholder="197.00"
                />
              </div>
              <p className="text-sm text-gray-500">
                Atual: {formatPrice(prices.top)}/mês
              </p>
            </div>

            {/* Premium Plan */}
            <div className="space-y-2">
              <Label htmlFor="premium-price">Plano Premium</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">R$</span>
                <Input
                  id="premium-price"
                  type="number"
                  value={prices.premium}
                  onChange={(e) => handlePriceChange('premium', e.target.value)}
                  className="pl-10"
                  placeholder="397.00"
                />
              </div>
              <p className="text-sm text-gray-500">
                Atual: {formatPrice(prices.premium)}/mês
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2 text-orange-600">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">
                Alterações nos preços afetarão apenas novas assinaturas
              </span>
            </div>

            <Button 
              onClick={handleSave}
              disabled={isSaving}
              className="min-w-[120px]"
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? 'Salvando...' : 'Salvar Preços'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos Passos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">1. Configure os produtos no Stripe:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Acesse o <a href="https://dashboard.stripe.com/products" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Dashboard do Stripe</a></li>
              <li>Crie produtos para cada plano (Básico, Top, Premium)</li>
              <li>Configure preços recorrentes mensais</li>
              <li>Anote os IDs dos preços criados</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium">2. Teste o sistema:</h4>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li>Use cartões de teste do Stripe</li>
              <li>Verifique o fluxo de checkout</li>
              <li>Teste o portal do cliente</li>
              <li>Confirme a sincronização de status</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StripeConfig;
