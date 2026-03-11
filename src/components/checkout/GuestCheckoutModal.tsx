import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSupabase } from '@/hooks/useSupabase';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { ArrowRight, CreditCard, Crown, CheckCircle, ChevronLeft } from 'lucide-react';
import { openPaymentCheckout } from '@/lib/utils';
import { CompleteBillingForm, BillingFormData } from './CompleteBillingForm';
import { usePaymentsConfig } from '@/hooks/usePaymentsConfig';

interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GuestCheckoutModal: React.FC<GuestCheckoutModalProps> = ({ isOpen, onClose }) => {
  const { toast } = useToast();
  const supabase = useSupabase();
  const { isHybridReady } = usePaymentsConfig();
  const [step, setStep] = useState<'plan' | 'billing'>('plan');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    whatsapp: ''
  });
  const [billingData, setBillingData] = useState<BillingFormData | null>(null);
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annual'>('monthly');
  const [isLoading, setIsLoading] = useState(false);

  const planDetails = {
    monthly: { 
      name: 'Premium Mensal', 
      price: 'R$ 349,99',
      period: '/mês'
    },
    annual: { 
      name: 'Premium Anual', 
      price: 'R$ 2.499,00', 
      period: '/ano'
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFormSubmit = () => {
    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e email.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive"
      });
      return;
    }

    setStep('billing');
  };

  const handleBillingSubmit = async (data: BillingFormData) => {
    setBillingData(data);
    // Directly redirect to Stripe Checkout after billing data is completed
    await handleStripeCheckout();
  };

  const handleStripeCheckout = async () => {
    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e email.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",
        description: "Por favor, insira um email válido.",
        variant: "destructive"
      });
      return;
    }

    // Redirecionar para o checkout V5 com os dados do guest
    const params = new URLSearchParams({
      plan: billingPeriod === 'monthly' ? 'mensal' : 'anual',
      guest_name: formData.name,
      guest_email: formData.email,
      guest_phone: formData.whatsapp || ''
    });

    console.log('[GuestCheckout] Redirecting to V5 checkout with params:', params.toString());

    // Navigate to the V5 checkout page
    window.location.href = `/checkout?${params.toString()}`;
    
    // Close modal
    onClose();
  };

  const handleParceladoClick = () => {
    // Validate required fields
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha nome e email antes de continuar.",
        variant: "destructive"
      });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast({
        title: "Email inválido",  
        description: "Por favor, insira um email válido.",
        variant: "destructive"
      });
      return;
    }

    // Calculate amount based on billing period
    const amount = billingPeriod === 'monthly' ? 34999 : 249900; // in cents
    
    // Build URL with guest data
    const params = new URLSearchParams({
      amount: amount.toString(),
      currency: 'BRL',
      ref: 'guest_checkout',
      guest_name: formData.name,
      guest_email: formData.email,
      guest_whatsapp: formData.whatsapp || '',
      plan_type: 'premium',
      billing_period: billingPeriod
    });

    // Navigate to parcelado page with guest data
    window.location.href = `/checkout/parcelado?${params.toString()}`;
    
    // Close modal
    onClose();
  };

  const getStepTitle = () => {
    switch (step) {
      case 'plan': return 'Escolher Plano Premium';
      case 'billing': return 'Finalizar Assinatura';
      default: return 'Finalizar Assinatura Premium';
    }
  };

  const getStepDescription = () => {
    switch (step) {
      case 'plan': return 'Selecione o plano e preencha seus dados';
      case 'billing': return 'Dados para faturamento e redirecionamento para pagamento';
      default: return 'Preencha seus dados para finalizar a assinatura';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription>
            {getStepDescription()}
          </DialogDescription>
          
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mt-4">
            <div className={`h-2 w-1/2 rounded-full ${step === 'plan' ? 'bg-primary' : 'bg-primary/30'}`} />
            <div className={`h-2 w-1/2 rounded-full ${step === 'billing' ? 'bg-primary' : 'bg-muted'}`} />
          </div>
        </DialogHeader>

        {step === 'plan' && (
          <div className="space-y-6">
            {/* Plan Selection */}
            <div className="space-y-3">
              <Label className="text-base font-medium">Escolha seu plano</Label>
              <RadioGroup 
                value={billingPeriod} 
                onValueChange={(value: 'monthly' | 'annual') => setBillingPeriod(value)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <label htmlFor="monthly" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Premium Mensal</div>
                        <div className="text-sm text-muted-foreground">Acesso completo</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">R$ 349,99</div>
                        <div className="text-sm text-muted-foreground">/mês</div>
                      </div>
                    </div>
                  </label>
                </div>
                
                <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-accent/50 transition-colors relative">
                  <div className="absolute -top-2 left-4 bg-green-500 text-white text-xs px-2 py-1 rounded">
                    🏆 Mais Vantajoso
                  </div>
                  <RadioGroupItem value="annual" id="annual" />
                  <label htmlFor="annual" className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="font-medium">Premium Anual</div>
                        <div className="text-sm text-green-600 font-medium">Economize R$ 1.700</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">R$ 2.499,00</div>
                        <div className="text-sm text-muted-foreground">/ano</div>
                      </div>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            </div>

            {/* Plan Summary */}
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">
                    {planDetails[billingPeriod].name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Assinatura premium completa
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">
                    {planDetails[billingPeriod].price}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {planDetails[billingPeriod].period}
                  </div>
                </div>
              </div>
            </div>

            {/* User Information */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Seus dados</Label>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Nome completo *</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Seu nome completo"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="whatsapp">WhatsApp (opcional)</Label>
                  <Input
                    id="whatsapp"
                    name="whatsapp"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.whatsapp}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-3">
              {/* Stripe Checkout Button */}
              <Button 
                onClick={handleFormSubmit}
                className="w-full h-12 text-base font-medium"
                size="lg"
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Pagar com Cartão (Stripe)
              </Button>

              {/* Installment Payment Button */}
              {isHybridReady && (
                <Button 
                  onClick={handleParceladoClick}
                  variant="outline"
                  className="w-full h-12 text-base font-medium"
                  size="lg"
                >
                  💳 Pagar Parcelado (até 12x)
                </Button>
              )}
            </div>

            {/* Security Note */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Pagamento seguro processado pelo Stripe</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Após o pagamento, você receberá um email para definir sua senha de acesso.
              </p>
            </div>
          </div>
        )}

        {step === 'billing' && (
          <div className="space-y-4">
            <Button 
              variant="ghost" 
              onClick={() => setStep('plan')}
              className="self-start p-2 h-auto"
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Voltar
            </Button>
            
            <CompleteBillingForm
              onSubmit={handleBillingSubmit}
              isLoading={isLoading}
              initialData={billingData || undefined}
            />
            
            {/* Security Note for Billing Step */}
            <div className="text-center space-y-2 pt-4 border-t">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span>Redirecionamento seguro para pagamento Stripe</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Após preencher os dados, você será redirecionado para completar o pagamento de forma segura.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};