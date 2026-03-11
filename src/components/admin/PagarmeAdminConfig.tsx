// =============================================
// Componente Admin para configuração Pagar.me
// Integrado com Stripe via Custom Payment Method
// =============================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CreditCard, 
  Save, 
  TestTube, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ExternalLink, 
  CheckCircle,
  PiggyBank,
  Calculator,
  HelpCircle
} from 'lucide-react';
import { usePagarmeConfig } from '@/hooks/usePagarmeConfig';
import { 
  PaymentEnvironment, 
  isValidCpmtId, 
  isValidPagarmePublicKey, 
  getPagarmeKeyEnvironment,
  formatAmountFromCents 
} from '@/types/payments';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

const PagarmeAdminConfig: React.FC = () => {
  const { toast } = useToast();
  const { 
    config, 
    loading, 
    saving, 
    testing, 
    upsertConfig, 
    testConnection, 
    isConfigured,
    hasCustomPaymentMethod
  } = usePagarmeConfig();

  // Form state
  const [formData, setFormData] = useState({
    environment: 'test' as PaymentEnvironment,
    public_key: '',
    secret_key: '',
    encryption_key: '',
    webhook_secret: '',
    account_id: '',
    stripe_custom_payment_method_id: '',
    plan_id_mensal: '',
    plan_id_anual: '',
    installments_max: 12,
    free_installments: 0,
    interest_rate: 2.99,
    statement_descriptor: ''
  });

  const [showSecrets, setShowSecrets] = useState({
    secret_key: false,
    encryption_key: false,
    webhook_secret: false
  });

  // Carregar dados existentes
  useEffect(() => {
    if (config) {
      setFormData({
        environment: config.environment,
        public_key: config.public_key || '',
        secret_key: '', // Nunca pré-popular secrets
        encryption_key: '',
        webhook_secret: '',
        account_id: config.account_id || '',
        stripe_custom_payment_method_id: config.stripe_custom_payment_method_id || '',
        plan_id_mensal: (config as any).plan_id_mensal || '',
        plan_id_anual: (config as any).plan_id_anual || '',
        installments_max: config.installments_max,
        free_installments: config.free_installments,
        interest_rate: config.interest_rate || 2.99,
        statement_descriptor: config.statement_descriptor || ''
      });
    }
  }, [config]);

  // Validações
  const keyEnvironmentMismatch = formData.public_key && 
    getPagarmeKeyEnvironment(formData.public_key) !== formData.environment;
    
  const invalidCpmtId = formData.stripe_custom_payment_method_id && 
    !isValidCpmtId(formData.stripe_custom_payment_method_id);
    
  const invalidPublicKey = formData.public_key && 
    !isValidPagarmePublicKey(formData.public_key);

  // Handlers
  const handleSave = async () => {
    console.log('[PagarmeAdminConfig] Starting save with data:', formData);
    
    // Validação relaxada de Plan IDs (mínimo 5 chars, permite _ e -)
    if (formData.plan_id_mensal && !/^plan_[A-Za-z0-9_-]{5,}$/.test(formData.plan_id_mensal)) {
      toast({
        title: "Erro de Validação",
        description: "Plan ID Mensal deve começar com 'plan_' seguido de caracteres alfanuméricos (mínimo 5)",
        variant: "destructive"
      });
      console.error('[PagarmeAdminConfig] Invalid plan_id_mensal format:', formData.plan_id_mensal);
      return;
    }

    if (formData.plan_id_anual && !/^plan_[A-Za-z0-9_-]{5,}$/.test(formData.plan_id_anual)) {
      toast({
        title: "Erro de Validação",
        description: "Plan ID Anual deve começar com 'plan_' seguido de caracteres alfanuméricos (mínimo 5)",
        variant: "destructive"
      });
      console.error('[PagarmeAdminConfig] Invalid plan_id_anual format:', formData.plan_id_anual);
      return;
    }
    
    try {
      // ⚠️ IMPORTANTE: Agora usamos sistema híbrido
      // - Chaves sensíveis vão para Supabase Secrets
      // - Configurações gerais vão para tabela pagarme_config
      
      const updates: any = {
        environment: formData.environment,
        public_key: formData.public_key || null,
        secret_key: formData.secret_key.trim() || null,
        webhook_secret: formData.webhook_secret.trim() || null,
        stripe_custom_payment_method_id: formData.stripe_custom_payment_method_id || null,
        plan_id_mensal: formData.plan_id_mensal || null,
        plan_id_anual: formData.plan_id_anual || null,
        installments_max: formData.installments_max,
        free_installments: formData.free_installments,
        interest_rate: formData.interest_rate > 0 ? formData.interest_rate : null,
        statement_descriptor: formData.statement_descriptor || null,
        account_id: formData.account_id.trim() || null
      };

      console.log('[PagarmeAdminConfig] Salvando configuração...', {
        environment: formData.environment,
        hasPlanMensal: !!formData.plan_id_mensal,
        hasPlanAnual: !!formData.plan_id_anual,
        hasAccountId: !!formData.account_id
      });

      const success = await upsertConfig(updates);
      
      console.log('[PagarmeAdminConfig] Resultado do salvamento:', success);
      
      if (success) {
        toast({
          title: "✅ Configurações Salvas!",
          description: `Ambiente ${formData.environment === 'live' ? 'Produção' : 'Teste'} configurado com sucesso.`,
        });
        
        // Limpar campos sensíveis
        setFormData(prev => ({
          ...prev,
          secret_key: '',
          encryption_key: '',
          webhook_secret: ''
        }));
      }
    } catch (error) {
      console.error('[PagarmeAdminConfig] Erro ao salvar configuração do Pagar.me:', error);
      toast({
        title: "Erro ao salvar",
        description: "Erro ao salvar configuração. Verifique suas permissões de administrador.",
        variant: "destructive"
      });
    }
  };

  const handleTest = async () => {
    await testConnection();
  };

  const toggleSecretVisibility = (field: keyof typeof showSecrets) => {
    setShowSecrets(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Cálculo de parcela exemplo
  const calculateInstallmentExample = (amount: number = 34999) => { // R$ 349,99
    if (formData.installments_max <= 0) return null;
    
    const totalInstallments = formData.installments_max;
    const freeInstallments = Math.min(formData.free_installments, totalInstallments);
    const interestRate = formData.interest_rate / 100; // Converter % para decimal
    
    let result = [];
    
    for (let i = 1; i <= totalInstallments; i++) {
      if (i <= freeInstallments) {
        // Sem juros
        result.push({
          installments: i,
          amount_per_installment: amount / i,
          total_amount: amount,
          interest_amount: 0
        });
      } else {
        // Com juros compostos
        const monthlyRate = interestRate;
        const totalAmount = amount * Math.pow(1 + monthlyRate, i);
        const installmentAmount = totalAmount / i;
        
        result.push({
          installments: i,
          amount_per_installment: installmentAmount,
          total_amount: totalAmount,
          interest_amount: totalAmount - amount
        });
      }
    }
    
    return result;
  };

  const installmentExamples = calculateInstallmentExample();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PiggyBank className="w-5 h-5 text-orange-500" />
            <span>Status Pagar.me (Parcelado)</span>
            {isConfigured ? (
              <Badge className="bg-green-500 text-white">
                <CheckCircle className="w-3 h-3 mr-1" />
                Configurado
              </Badge>
            ) : (
              <Badge variant="destructive">Pendente</Badge>
            )}
          </CardTitle>
          <CardDescription>
            {isConfigured 
              ? `Ambiente: ${config?.environment === 'live' ? 'Produção' : 'Teste'} • Max parcelas: ${config?.installments_max}x`
              : 'Configure o Pagar.me para habilitar pagamentos parcelados'
            }
          </CardDescription>
        </CardHeader>
        {isConfigured && (
          <CardContent>
            <div className="flex space-x-2">
              <Button 
                onClick={handleTest} 
                disabled={testing} 
                variant="outline"
                size="sm"
              >
                <TestTube className="w-4 h-4 mr-2" />
                {testing ? 'Testando...' : 'Testar Conexão'}
              </Button>
              {hasCustomPaymentMethod && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <CreditCard className="w-3 h-3 mr-1" />
                  Integração Híbrida Ativa
                </Badge>
              )}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Configurações Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração Principal</CardTitle>
          <CardDescription>
            Chaves de API e ambiente do Pagar.me
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Ambiente */}
          <div className="space-y-2">
            <Label htmlFor="pagarme_environment">Ambiente</Label>
            <Select
              value={formData.environment}
              onValueChange={(value: PaymentEnvironment) => 
                setFormData(prev => ({ ...prev, environment: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ambiente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="test">Teste (Sandbox)</SelectItem>
                <SelectItem value="live">Produção (Live)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Public Key */}
          <div className="space-y-2">
            <Label htmlFor="pagarme_public_key">Public Key</Label>
            <Input
              id="pagarme_public_key"
              type="text"
              placeholder={`pk_${formData.environment}_...`}
              value={formData.public_key}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, public_key: e.target.value }))
              }
              className={invalidPublicKey ? "border-red-500" : ""}
            />
            {keyEnvironmentMismatch && (
              <p className="text-sm text-red-600 flex items-center">
                <AlertCircle className="w-4 h-4 mr-1" />
                A chave não corresponde ao ambiente selecionado
              </p>
            )}
          </div>

          {/* Secret Key - Novo Sistema Híbrido */}
          <div className="space-y-2">
            <Label htmlFor="pagarme_secret_key" className="flex items-center space-x-2">
              <span>Secret Key</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                🔒 Supabase Secrets
              </Badge>
            </Label>
            
            <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
              <p className="text-sm text-blue-800 mb-2">
                <strong>🔒 Sistema de Segurança Atualizado</strong>
              </p>
              <p className="text-sm text-blue-700 mb-2">
                Por segurança, as secret keys agora devem ser configuradas diretamente nos Supabase Secrets:
              </p>
              <ul className="text-sm text-blue-700 space-y-1 ml-4">
                <li>• <code>PAGARME_SECRET_KEY_TEST</code> - Para ambiente de teste</li>
                <li>• <code>PAGARME_SECRET_KEY_LIVE</code> - Para ambiente de produção</li>
              </ul>
              <div className="mt-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open('https://supabase.com/dashboard/project/ibwhqkgvrkkqxiksbiqr/settings/functions', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Configurar Secrets
                </Button>
              </div>
            </div>
            
            <div className="relative">
              <Input
                id="pagarme_secret_key"
                type="text"
                placeholder="Configure nos Supabase Secrets por segurança"
                disabled
                className="bg-gray-50 text-gray-500"
              />
            </div>
          </div>

          {/* Encryption Key - DEPRECATED V5 */}
          <div className="space-y-2">
            <Label htmlFor="pagarme_encryption_key" className="flex items-center space-x-2">
              <span className="line-through text-gray-400">Encryption Key</span>
              <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300">
                ❌ Não usado no V5
              </Badge>
            </Label>
            
            <div className="p-3 border rounded-lg bg-gray-50 border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>V5 usa Tokenizecard.js</strong> - A encryption_key não é mais necessária.
                A tokenização ocorre automaticamente via <code>checkout.pagar.me/v1/tokenizecard.js</code>
              </p>
            </div>
            
            <Input
              id="pagarme_encryption_key"
              type="text"
              disabled
              placeholder="Não necessário no V5"
              className="bg-gray-50 text-gray-400"
            />
          </div>

          {/* Account ID */}
          <div className="space-y-2">
            <Label htmlFor="pagarme_account_id" className="flex items-center space-x-1">
              <span>ID da Conta</span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="w-3 h-3 text-gray-400" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>ID da conta (recipient) no Pagar.me para receber os pagamentos</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <Input
              id="pagarme_account_id"
              type="text"
              placeholder="rp_..."
              value={formData.account_id}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, account_id: e.target.value }))
              }
            />
          </div>

          {/* Webhook Secret - Sistema Híbrido */}
          <div className="space-y-2">
            <Label htmlFor="pagarme_webhook_secret" className="flex items-center space-x-2">
              <span>Webhook Secret</span>
              <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                🔒 Opcional
              </Badge>
            </Label>
            
            <div className="p-3 border rounded-lg bg-gray-50 border-gray-200">
              <p className="text-sm text-gray-600">
                Configure manualmente nos Supabase Secrets para máxima segurança (opcional).
              </p>
            </div>
            
            <div className="relative">
              <Input
                id="pagarme_webhook_secret"
                type="text"
                placeholder="Configure nos Supabase Secrets se necessário"
                disabled
                className="bg-gray-50 text-gray-500"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integração Híbrida (Opcional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PiggyBank className="w-5 h-5" />
            <span>IDs dos Planos V5</span>
            <Badge variant="secondary">Obrigatório</Badge>
          </CardTitle>
          <CardDescription>
            Copie os IDs dos planos criados no Dashboard Pagar.me
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="plan_id_mensal">Plan ID Mensal</Label>
              <Input
                id="plan_id_mensal"
                placeholder="plan_xxxxxxxxxxxxx"
                value={formData.plan_id_mensal}
                onChange={(e) => setFormData(prev => ({ ...prev, plan_id_mensal: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                ID do plano mensal no Pagar.me (formato: plan_xxxxx)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="plan_id_anual">Plan ID Anual</Label>
              <Input
                id="plan_id_anual"
                placeholder="plan_xxxxxxxxxxxxx"
                value={formData.plan_id_anual}
                onChange={(e) => setFormData(prev => ({ ...prev, plan_id_anual: e.target.value }))}
              />
              <p className="text-xs text-muted-foreground">
                ID do plano anual no Pagar.me (formato: plan_xxxxx)
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Integração Híbrida com Stripe (Opcional) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5" />
            <span>Integração Híbrida</span>
            <Badge variant="outline">Opcional</Badge>
          </CardTitle>
          <CardDescription>
            Para usar Pagar.me junto com Stripe, configure o Custom Payment Method ID
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="stripe_cpmt_id">Stripe Custom Payment Method ID</Label>
            <Input
              id="stripe_cpmt_id"
              type="text"
              placeholder="cpmt_1A2B3C... (opcional)"
              value={formData.stripe_custom_payment_method_id}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, stripe_custom_payment_method_id: e.target.value }))
              }
              className={invalidCpmtId ? "border-red-500" : ""}
            />
            {invalidCpmtId && (
              <p className="text-sm text-red-600">
                ID deve começar com "cpmt_" seguido de pelo menos 24 caracteres
              </p>
            )}
            <p className="text-sm text-muted-foreground">
              Apenas necessário se você quiser usar o Pagar.me dentro do Stripe Elements
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Configurações de Parcelamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calculator className="w-5 h-5" />
            <span>Parcelamento</span>
          </CardTitle>
          <CardDescription>
            Configure as opções de parcelamento e juros
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="installments_max">Máximo de Parcelas</Label>
              <Select
                value={formData.installments_max.toString()}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, installments_max: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(i => (
                    <SelectItem key={i} value={i.toString()}>{i}x</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="free_installments">Parcelas sem Juros</Label>
              <Select
                value={formData.free_installments.toString()}
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, free_installments: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: formData.installments_max + 1 }, (_, i) => i).map(i => (
                    <SelectItem key={i} value={i.toString()}>{i === 0 ? 'Nenhuma' : `${i}x`}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interest_rate">Taxa de Juros (% a.m.)</Label>
              <Input
                id="interest_rate"
                type="number"
                step="0.01"
                min="0"
                max="15"
                placeholder="2.99"
                value={formData.interest_rate}
                onChange={(e) => 
                  setFormData(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="statement_descriptor">Descritor de Fatura (Opcional)</Label>
            <Input
              id="statement_descriptor"
              type="text"
              maxLength={22}
              placeholder="CAMPLY PREMIUM"
              value={formData.statement_descriptor}
              onChange={(e) => 
                setFormData(prev => ({ ...prev, statement_descriptor: e.target.value }))
              }
            />
            <p className="text-sm text-muted-foreground">
              Como aparece na fatura do cartão (máx. 22 caracteres)
            </p>
          </div>

          {/* Preview de Parcelas */}
          {installmentExamples && formData.installments_max > 1 && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium mb-3">Simulação de Parcelas (R$ 349,99)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                {installmentExamples.slice(0, 8).map(calc => (
                  <div key={calc.installments} className="text-center">
                    <div className="font-medium">{calc.installments}x</div>
                    <div className="text-green-600">
                      {formatAmountFromCents(calc.amount_per_installment)}
                    </div>
                    {calc.interest_amount > 0 && (
                      <div className="text-xs text-orange-600">
                        +{formatAmountFromCents(calc.interest_amount)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={() => window.open('https://dashboard.pagar.me', '_blank')}
              className="flex items-center space-x-2"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Dashboard Pagar.me</span>
            </Button>

            <Button 
              onClick={handleSave}
              disabled={saving || invalidCpmtId || invalidPublicKey || keyEnvironmentMismatch}
              className="min-w-[160px]"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 mr-2 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configuração
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PagarmeAdminConfig;