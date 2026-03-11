import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { usePaymentsConfig } from '@/hooks/usePaymentsConfig';
import { supabase } from '@/integrations/supabase/client';
import CardFormPagarme from '@/components/checkout/CardFormPagarme';

interface UpdateCardFormProps {
  subscriptionId: string;
  onSuccess?: () => void;
}

export default function UpdateCardForm({ subscriptionId, onSuccess }: UpdateCardFormProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { config } = usePaymentsConfig();

  const handleCardUpdate = async (tokenOrHash: string) => {
    setLoading(true);
    try {
      const response = await supabase.functions.invoke('pagarme-subscriptions-update-card', {
        body: {
          subscription_id: subscriptionId,
          card_hash: tokenOrHash
        }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      toast({
        title: "Cartão atualizado",
        description: "Sua forma de pagamento foi atualizada com sucesso.",
      });

      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar cartão",
        description: error.message || "Não foi possível atualizar o cartão.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!config?.pagarme) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">Configuração de pagamento não encontrada.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Atualize os dados do seu cartão de crédito. Suas informações são processadas de forma segura.
      </p>
      
      <CardFormPagarme
        publicKey={config.pagarme.public_key || ''}
        onTokenize={handleCardUpdate}
        loading={loading}
        buttonText="Atualizar Cartão"
      />
    </div>
  );
}