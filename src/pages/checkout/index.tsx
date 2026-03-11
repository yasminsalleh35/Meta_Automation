// =============================================
// Página de Checkout Pagar.me (único provedor)
// Suporta assinaturas, parcelamento e PIX
// =============================================

import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { usePaymentsConfig } from '@/hooks/usePaymentsConfig';
import { ArrowLeft, CreditCard, Shield, CheckCircle, Zap } from 'lucide-react';
import PlanSelector from '@/components/checkout/PlanSelector';
import InstallmentsPicker from '@/components/checkout/InstallmentsPicker';
import CardFormPagarme from '@/components/checkout/CardFormPagarme';
// import PixBlock from '@/components/checkout/PixBlock';
import { usePagarmeCheckout } from '@/hooks/usePagarmeCheckout';

interface CheckoutStep {
  id: string;
  title: string;
  completed: boolean;
}

const CheckoutPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { config, isPagarmeConfigured } = usePaymentsConfig();
  
  // Estados do checkout
  const [selectedPlan, setSelectedPlan] = useState<{
    id: string;
    name: string;
    price: number;
    billingPeriod: 'monthly' | 'annual';
  } | null>(null);
  
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix'>('card');
  const [installments, setInstallments] = useState(1);
  const [guestData, setGuestData] = useState({
    name: '',
    email: '',
    whatsapp: '',
    document: ''
  });
  
  const [currentStep, setCurrentStep] = useState<'plan' | 'payment' | 'confirmation'>('plan');
  const [loading, setLoading] = useState(false);
  
  const {
    startPagarmeParcelado,
    loading: pagarmeLoading
  } = usePagarmeCheckout();

  // Pré-selecionar plano se vier da URL
  useEffect(() => {
    const planFromUrl = searchParams.get('plan');
    const amountFromUrl = searchParams.get('amount');
    const periodFromUrl = searchParams.get('period') as 'monthly' | 'annual';
    
    if (planFromUrl && amountFromUrl) {
      setSelectedPlan({
        id: planFromUrl,
        name: planFromUrl === 'premium' ? 'Camply Premium' : planFromUrl,
        price: parseFloat(amountFromUrl),
        billingPeriod: periodFromUrl || 'monthly'
      });
      setCurrentStep('payment');
    }
  }, [searchParams]);

  // Verificar se Pagar.me está configurado
  if (!isPagarmeConfigured || !config?.pagarme) {
    return (
      <div className="container mx-auto py-8">
        <Alert className="max-w-2xl mx-auto">
          <AlertDescription>
            Sistema de pagamentos em configuração. Tente novamente em alguns instantes.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handlePlanSelection = (plan: any) => {
    setSelectedPlan(plan);
    setCurrentStep('payment');
  };

  const handlePaymentSubmit = async (tokenOrHash: string) => {
    if (!selectedPlan) return;
    
    setLoading(true);
    try {
      const customerData = user ? {
        name: user.name || user.email,
        email: user.email,
        ...(guestData.document && { document: guestData.document })
      } : {
        name: guestData.name,
        email: guestData.email,
        whatsapp: guestData.whatsapp,
        document: guestData.document
      };

      await startPagarmeParcelado({
        amount: Math.round(selectedPlan.price * 100),
        currency: 'BRL',
        metadata: {
          billing_period: selectedPlan.billingPeriod,
          source: 'checkout_page',
          is_guest: String(!user),
          customer_data: JSON.stringify(customerData),
          installments: String(installments),
          token_or_hash: tokenOrHash
        }
      });

      // Sucesso será tratado pelo hook (redirecionamento)
      
    } catch (error) {
      console.error('Erro no pagamento:', error);
      toast({
        title: "Erro no pagamento",
        description: "Não foi possível processar o pagamento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const steps: CheckoutStep[] = [
    { id: 'plan', title: 'Plano', completed: !!selectedPlan },
    { id: 'payment', title: 'Pagamento', completed: false },
    { id: 'confirmation', title: 'Confirmação', completed: false }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar</span>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Checkout Seguro</h1>
            <p className="text-gray-600">Processado com segurança pelo Pagar.me</p>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                  step.completed || currentStep === step.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {step.completed ? <CheckCircle className="w-4 h-4" /> : index + 1}
                </div>
                <span className={`ml-2 text-sm ${
                  step.completed || currentStep === step.id
                    ? 'text-blue-600 font-medium'
                    : 'text-gray-500'
                }`}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Conteúdo Principal */}
          <div className="lg:col-span-2 space-y-6">
            {currentStep === 'plan' && (
              <Card>
                <CardHeader>
                  <CardTitle>Escolha seu Plano</CardTitle>
                  <CardDescription>
                    Selecione o plano que melhor se adequa às suas necessidades
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PlanSelector onPlanSelect={handlePlanSelection} />
                </CardContent>
              </Card>
            )}

            {currentStep === 'payment' && selectedPlan && (
              <>
                {/* Guest Data (se não autenticado) */}
                {!user && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Seus Dados</CardTitle>
                      <CardDescription>
                        Preencha seus dados para criar sua conta
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Nome Completo</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={guestData.name}
                            onChange={(e) => setGuestData(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="Seu nome completo"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Email</label>
                          <input
                            type="email"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={guestData.email}
                            onChange={(e) => setGuestData(prev => ({ ...prev, email: e.target.value }))}
                            placeholder="seu@email.com"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">WhatsApp</label>
                          <input
                            type="tel"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={guestData.whatsapp}
                            onChange={(e) => setGuestData(prev => ({ ...prev, whatsapp: e.target.value }))}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">CPF/CNPJ</label>
                          <input
                            type="text"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={guestData.document}
                            onChange={(e) => setGuestData(prev => ({ ...prev, document: e.target.value }))}
                            placeholder="000.000.000-00"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Método de Pagamento */}
                <Card>
                  <CardHeader>
                    <CardTitle>Método de Pagamento</CardTitle>
                    <CardDescription>
                      Escolha como deseja pagar
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex space-x-4 mb-6">
                      <Button
                        variant={paymentMethod === 'card' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('card')}
                        className="flex items-center space-x-2"
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Cartão de Crédito</span>
                      </Button>
                      <Button
                        variant={paymentMethod === 'pix' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('pix')}
                        className="flex items-center space-x-2"
                      >
                        <Zap className="w-4 h-4" />
                        <span>PIX</span>
                      </Button>
                    </div>

                    {paymentMethod === 'card' && (
                      <>
                        {/* Seletor de Parcelas */}
                        <div className="mb-6">
                          <InstallmentsPicker
                            amount={selectedPlan.price}
                            maxInstallments={config.pagarme.installments_max}
                            freeInstallments={config.pagarme.free_installments}
                            interestRate={config.pagarme.interest_rate}
                            onInstallmentSelect={setInstallments}
                          />
                        </div>

                        {/* Formulário do Cartão */}
                        <CardFormPagarme
                          publicKey={config.pagarme.public_key || ''}
                          onTokenize={handlePaymentSubmit}
                          loading={loading || pagarmeLoading}
                        />
                      </>
                    )}

                    {paymentMethod === 'pix' && (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <p className="text-blue-800">PIX será implementado em breve</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>

          {/* Resumo Lateral */}
          <div className="space-y-6">
            {selectedPlan && (
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{selectedPlan.name}</span>
                    <Badge>{selectedPlan.billingPeriod === 'monthly' ? 'Mensal' : 'Anual'}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Valor</span>
                    <span className="font-medium">R$ {selectedPlan.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                  
                  {paymentMethod === 'card' && installments > 1 && (
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>Parcelas</span>
                      <span>{installments}x de R$ {(selectedPlan.price / installments).toFixed(2).replace('.', ',')}</span>
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="flex justify-between items-center font-medium">
                    <span>Total</span>
                    <span>R$ {selectedPlan.price.toFixed(2).replace('.', ',')}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Segurança */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-3 text-sm text-gray-600">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium">Pagamento Seguro</p>
                    <p>Protegido pelo Pagar.me</p>
                    <p>Certificação PCI DSS</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;