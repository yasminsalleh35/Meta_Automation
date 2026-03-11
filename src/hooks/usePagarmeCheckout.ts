import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePaymentsConfig } from '@/hooks/usePaymentsConfig';
import { PagarmeInitRequest, PagarmeInitResponse } from '@/types/payments';

export const usePagarmeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [showInstallmentsModal, setShowInstallmentsModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedInstallments, setSelectedInstallments] = useState<number>(1);
  const [currentAmount, setCurrentAmount] = useState<number>(0);
  const [currentMetadata, setCurrentMetadata] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const { config } = usePaymentsConfig();

  const startPagarmeParcelado = async ({
    amount,
    currency = 'BRL',
    metadata = {}
  }: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
  }) => {
    console.log('[cpmt-handler] Starting Pagar.me parcelado flow', { amount, currency });
    
    if (!config?.pagarme?.installments_max) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Configuração Pagar.me não encontrada"
      });
      return;
    }

    setCurrentAmount(amount);
    setCurrentMetadata(metadata);
    setShowInstallmentsModal(true);
  };

  const handleInstallmentsSelected = (installments: number) => {
    console.log('[cpmt-handler] Installments selected:', installments);
    setSelectedInstallments(installments);
    setShowInstallmentsModal(false);
    setShowCardModal(true);
  };

  const handleCardTokenized = async (cardToken: string) => {
    console.log('[cpmt-handler] Card tokenized, calling pagarme-subscribe V5');
    setShowCardModal(false);
    setLoading(true);

    try {
      // V5 Payload para pagarme-subscribe
      const payload = {
        card_token: cardToken,
        plan_id: currentMetadata.plan_type === 'annual' ? 'anual' : 'mensal',
        installments: selectedInstallments,
        buyer: {
          name: currentMetadata.guest_name || 'Cliente',
          email: currentMetadata.guest_email || '',
          phone: currentMetadata.guest_phone || '5511999999999'
        }
      };

      console.log('[cpmt-handler] V5 payload:', payload);

      const { data, error } = await supabase.functions.invoke('pagarme-subscribe', {
        body: payload
      });

      if (error) {
        throw new Error(error.message);
      }

      const response = data as PagarmeInitResponse;

      if (!response.success) {
        throw new Error(response.error?.message || 'Erro na transação');
      }

      console.log('[cpmt-handler] Transaction successful:', response.data);

      // Sucesso - mostrar dados das parcelas e redirecionar
      const installmentInfo = response.data?.installment_info;
      const installmentText = installmentInfo 
        ? `${installmentInfo.installments}x de R$ ${(installmentInfo.amount_per_installment / 100).toFixed(2)}`
        : `${selectedInstallments}x`;

      toast({
        title: "Pagamento Aprovado!",
        description: `Cartão parcelado em ${installmentText}`,
      });

      // Redirecionar para success com dados da transação
      const searchParams = new URLSearchParams({
        session_id: response.data?.external_id || '',
        payment_method: 'pagarme_parcelado',
        installments: selectedInstallments.toString(),
        // Include guest data if present for user creation
        ...(currentMetadata.guest_checkout === 'true' && {
          guest_email: currentMetadata.guest_email || '',
          guest_name: currentMetadata.guest_name || '',
          plan_type: currentMetadata.plan_type || '',
          billing_period: currentMetadata.billing_period || ''
        })
      });
      
      window.location.href = `/checkout/success?${searchParams.toString()}`;

    } catch (error: any) {
      console.error('[cpmt-handler] Transaction failed:', error);
      
      toast({
        variant: "destructive",
        title: "Erro no Pagamento",
        description: error.message || 'Tente novamente ou escolha outro método de pagamento',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setShowInstallmentsModal(false);
    setShowCardModal(false);
    setLoading(false);
  };

  return {
    loading,
    showInstallmentsModal,
    showCardModal,
    selectedInstallments,
    currentAmount,
    config: config?.pagarme,
    startPagarmeParcelado,
    handleInstallmentsSelected,
    handleCardTokenized,
    handleClose
  };
};