import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash, DollarSign, ExternalLink, Loader2 } from 'lucide-react';
import { useAsaasPlans } from '@/hooks/useAsaasPlans';
import { AsaasEnvironment, AsaasCycle, AsaasBillingType } from '@/types/asaas';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AsaasPlansManagerProps {
  environment: AsaasEnvironment;
}

const AsaasPlansManager: React.FC<AsaasPlansManagerProps> = ({ environment }) => {
  const { plans, loading, saving, createPlan, updatePlan, deletePlan } = useAsaasPlans(environment);
  const { toast } = useToast();
  
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any>(null);
  const [creatingCheckout, setCreatingCheckout] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    internal_slug: '',
    name: '',
    description: '',
    amount: '0',
    billing_type: 'CREDIT_CARD' as AsaasBillingType,
    cycle: 'MONTHLY' as AsaasCycle,
    max_installment_count: 1,
    is_active: true,
    is_default_monthly: false,
    is_default_annual: false
  });

  const handleOpenCreate = () => {
    setEditingPlan(null);
    setFormData({
      internal_slug: '',
      name: '',
      description: '',
      amount: '0',
      billing_type: 'CREDIT_CARD',
      cycle: 'MONTHLY',
      max_installment_count: 1,
      is_active: true,
      is_default_monthly: false,
      is_default_annual: false
    });
    setDialogOpen(true);
  };

  const handleOpenEdit = (plan: any) => {
    setEditingPlan(plan);
    setFormData({
      internal_slug: plan.internal_slug,
      name: plan.name,
      description: plan.description || '',
      amount: plan.amount.toString(),
      billing_type: plan.billing_type,
      cycle: plan.cycle,
      max_installment_count: plan.max_installment_count,
      is_active: plan.is_active,
      is_default_monthly: plan.is_default_monthly,
      is_default_annual: plan.is_default_annual
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const payload: any = {
      internal_slug: formData.internal_slug,
      name: formData.name,
      description: formData.description,
      amount: parseFloat(formData.amount),
      billing_type: formData.billing_type,
      cycle: formData.cycle,
      max_installment_count: formData.max_installment_count,
      charge_type: 'RECURRENT',
      is_active: formData.is_active,
      is_default_monthly: formData.is_default_monthly,
      is_default_annual: formData.is_default_annual,
      metadata: {}
    };

    let success = false;
    if (editingPlan) {
      success = await updatePlan(editingPlan.id, payload);
    } else {
      success = await createPlan(payload);
    }

    if (success) {
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar este plano?')) {
      await deletePlan(id);
    }
  };

  const handleCreateCheckout = async (planId: string) => {
    setCreatingCheckout(planId);
    
    try {
      const { data, error } = await supabase.functions.invoke('asaas-create-checkout', {
        body: { planId }
      });
      
      if (error) throw error;
      
      if (!data.success || !data.checkoutUrl) {
        throw new Error(data.error || 'URL do checkout não retornada');
      }
      
      // Open checkout URL in new tab
      window.open(data.checkoutUrl, '_blank');
      
      toast({
        title: 'Checkout criado',
        description: 'Abrindo página de pagamento em nova aba...',
      });
    } catch (error: any) {
      console.error('Erro ao criar checkout:', error);
      toast({
        title: 'Erro ao criar checkout',
        description: error.message || 'Falha ao criar checkout de teste',
        variant: 'destructive',
      });
    } finally {
      setCreatingCheckout(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Planos Asaas ({environment})</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Carregando planos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Planos Asaas ({environment})</CardTitle>
              <CardDescription>
                Configure os planos de assinatura que serão oferecidos via Asaas
              </CardDescription>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Plano
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {plans.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Nenhum plano configurado para este ambiente.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Ciclo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Parcelas</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Padrão</TableHead>
                  <TableHead>Teste</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {plans.map((plan) => (
                  <TableRow key={plan.id}>
                    <TableCell className="font-medium">{plan.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{plan.cycle}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 mr-1 text-green-600" />
                        R$ {plan.amount.toFixed(2)}
                      </div>
                    </TableCell>
                    <TableCell>{plan.max_installment_count}x</TableCell>
                    <TableCell>
                      {plan.is_active ? (
                        <Badge variant="default">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary">Inativo</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {plan.is_default_monthly && <Badge variant="outline">Mensal</Badge>}
                      {plan.is_default_annual && <Badge variant="outline">Anual</Badge>}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateCheckout(plan.id)}
                        disabled={!plan.is_active || creatingCheckout === plan.id}
                      >
                        {creatingCheckout === plan.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Criando...
                          </>
                        ) : (
                          <>
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Testar
                          </>
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(plan)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(plan.id)}
                        >
                          <Trash className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingPlan ? 'Editar Plano' : 'Criar Novo Plano'}
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes do plano de assinatura Asaas
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="internal_slug">Slug Interno *</Label>
                <Input
                  id="internal_slug"
                  value={formData.internal_slug}
                  onChange={(e) => setFormData({ ...formData, internal_slug: e.target.value })}
                  placeholder="camply_monthly"
                  disabled={!!editingPlan}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Nome *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Camply Mensal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Plano mensal do Camply"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Valor (R$) *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="349.99"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cycle">Ciclo *</Label>
                <Select
                  value={formData.cycle}
                  onValueChange={(v) => setFormData({ ...formData, cycle: v as AsaasCycle })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MONTHLY">Mensal</SelectItem>
                    <SelectItem value="YEARLY">Anual</SelectItem>
                    <SelectItem value="WEEKLY">Semanal</SelectItem>
                    <SelectItem value="BIMONTHLY">Bimestral</SelectItem>
                    <SelectItem value="QUARTERLY">Trimestral</SelectItem>
                    <SelectItem value="SEMIANNUALLY">Semestral</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_installment">Máx. Parcelas</Label>
                <Input
                  id="max_installment"
                  type="number"
                  value={formData.max_installment_count}
                  onChange={(e) => setFormData({ ...formData, max_installment_count: parseInt(e.target.value) || 1 })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Ativo</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default_monthly}
                  onChange={(e) => setFormData({ ...formData, is_default_monthly: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Padrão Mensal</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_default_annual}
                  onChange={(e) => setFormData({ ...formData, is_default_annual: e.target.checked })}
                  className="rounded"
                />
                <span className="text-sm">Padrão Anual</span>
              </label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? 'Salvando...' : 'Salvar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AsaasPlansManager;
