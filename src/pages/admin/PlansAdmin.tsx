import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Package } from 'lucide-react';
import { useSupabase } from '@/hooks/useSupabase';

interface Plan {
  id?: string;
  plan_type: string;
  name: string;
  price_monthly: number;
  price_annual: number;
  trial_period_days: number;
  allowed_installments: number[];
  pagarme_plan_id_monthly?: string;
  pagarme_plan_id_annual?: string;
}

const PlansAdmin: React.FC = () => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlan, setCurrentPlan] = useState<Plan>({
    plan_type: 'premium',
    name: 'Premium',
    price_monthly: 349.99,
    price_annual: 2499.00,
    trial_period_days: 0,
    allowed_installments: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  });

  // Carregar planos existentes
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*');

      if (error) throw error;
      setPlans(data || []);
      
      // Se há um plano premium, carregar nos campos
      const premiumPlan = data?.find(p => p.plan_type === 'premium');
      if (premiumPlan) {
        setCurrentPlan(premiumPlan);
      }
    } catch (error) {
      console.error('Erro ao carregar planos:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar planos',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof Plan, value: any) => {
    setCurrentPlan(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleInstallmentsChange = (value: string) => {
    const installments = value.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    handleInputChange('allowed_installments', installments);
  };

  const saveAndSync = async () => {
    setSyncing(true);
    try {
      // 1. Salvar no banco (preços em R$)
      const { data: savedPlan, error: saveError } = await supabase
        .from('subscription_plans')
        .upsert({
          ...currentPlan,
          id: currentPlan.id || undefined
        }, { 
          onConflict: 'plan_type',
          ignoreDuplicates: false 
        })
        .select()
        .single();

      if (saveError) throw saveError;

      // 2. Sincronizar com Pagar.me v5
      const { data: syncData, error: syncError } = await supabase.functions.invoke('pagarme-plans-sync-v5', {
        body: { plan_type: currentPlan.plan_type }
      });

      if (syncError) throw syncError;

      toast({
        title: 'Sucesso!',
        description: 'Plano salvo e sincronizado com Pagar.me v5',
      });

      // Recarregar planos
      await fetchPlans();

    } catch (error) {
      console.error('Erro ao salvar/sincronizar:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Falha ao salvar plano',
        variant: 'destructive'
      });
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center gap-3 mb-8">
        <Package className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gerenciar Planos</h1>
          <p className="text-muted-foreground">Configure os planos de assinatura e sincronize com Pagar.me v5</p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Plano Premium</CardTitle>
          <CardDescription>
            Configure preços em reais - a conversão para centavos é feita automaticamente no backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan_type">Tipo do Plano</Label>
              <Input
                id="plan_type"
                value={currentPlan.plan_type}
                onChange={(e) => handleInputChange('plan_type', e.target.value)}
                placeholder="premium"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={currentPlan.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Premium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="price_monthly">Preço Mensal (R$)</Label>
              <Input
                id="price_monthly"
                type="number"
                step="0.01"
                value={currentPlan.price_monthly}
                onChange={(e) => handleInputChange('price_monthly', parseFloat(e.target.value) || 0)}
                placeholder="349.99"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_annual">Preço Anual (R$)</Label>
              <Input
                id="price_annual"
                type="number"
                step="0.01"
                value={currentPlan.price_annual}
                onChange={(e) => handleInputChange('price_annual', parseFloat(e.target.value) || 0)}
                placeholder="2499.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="trial_period_days">Período de Teste (dias)</Label>
            <Input
              id="trial_period_days"
              type="number"
              value={currentPlan.trial_period_days}
              onChange={(e) => handleInputChange('trial_period_days', parseInt(e.target.value) || 0)}
              placeholder="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="allowed_installments">Parcelas Permitidas</Label>
            <Input
              id="allowed_installments"
              value={currentPlan.allowed_installments.join(', ')}
              onChange={(e) => handleInstallmentsChange(e.target.value)}
              placeholder="1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12"
            />
            <p className="text-sm text-muted-foreground">
              Números separados por vírgula (ex: 1, 2, 3, 6, 12)
            </p>
          </div>

          {/* Status da sincronização */}
          {(currentPlan.pagarme_plan_id_monthly || currentPlan.pagarme_plan_id_annual) && (
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Status da Sincronização</h4>
              <div className="text-sm space-y-1">
                {currentPlan.pagarme_plan_id_monthly && (
                  <p>✅ Plano mensal: {currentPlan.pagarme_plan_id_monthly}</p>
                )}
                {currentPlan.pagarme_plan_id_annual && (
                  <p>✅ Plano anual: {currentPlan.pagarme_plan_id_annual}</p>
                )}
              </div>
            </div>
          )}

          <Button 
            onClick={saveAndSync} 
            disabled={syncing}
            className="w-full"
            size="lg"
          >
            {syncing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando e Sincronizando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar e Sincronizar com Pagar.me
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlansAdmin;