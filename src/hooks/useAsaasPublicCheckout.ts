import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

const EDGE_FUNCTION_URL = 'https://ibwhqkgvrkkqxiksbiqr.supabase.co/functions/v1/asaas-public-checkout';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlid2hxa2d2cmtrcXhpa3NiaXFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNTAwNzAsImV4cCI6MjA2MzkyNjA3MH0.N7QChffwKW_r1KzAMiWqSmQwXKp7CHosVcaP-HQVNuM';

export const useAsaasPublicCheckout = () => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isMobileDevice = (): boolean => {
    if (typeof window === 'undefined') return false;
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (window.innerWidth <= 768);
  };

  const startCheckout = async (planCode: 'mensal' | 'anual', userEmail?: string) => {
    setLoading(true);
    
    console.log(`[useAsaasPublicCheckout] Iniciando checkout para plano: ${planCode}`);
    console.log(`[useAsaasPublicCheckout] Dispositivo mobile: ${isMobileDevice()}`);

    // Abrir janela ANTES da chamada async para evitar popup blocker
    let checkoutWindow: Window | null = null;
    if (!isMobileDevice()) {
      checkoutWindow = window.open('about:blank', '_blank');
    }

    try {
      console.log('[useAsaasPublicCheckout] Enviando fetch direto para edge function...');
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('[useAsaasPublicCheckout] Timeout de 30s atingido!');
        controller.abort();
      }, 30000);

      const response = await fetch(EDGE_FUNCTION_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ planCode, userEmail }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log(`[useAsaasPublicCheckout] Resposta recebida - status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useAsaasPublicCheckout] Erro HTTP:', response.status, errorText);
        checkoutWindow?.close();
        throw new Error(`Erro HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('[useAsaasPublicCheckout] Data:', JSON.stringify(data));

      if (!data?.success || !data?.checkoutUrl) {
        checkoutWindow?.close();
        throw new Error(data?.error || 'Erro ao criar checkout');
      }

      console.log('[useAsaasPublicCheckout] Checkout criado, URL:', data.checkoutUrl);

      if (isMobileDevice()) {
        window.location.href = data.checkoutUrl;
      } else if (checkoutWindow) {
        checkoutWindow.location.href = data.checkoutUrl;
        toast({
          title: "Checkout aberto",
          description: "Complete sua assinatura na nova aba",
        });
      } else {
        window.location.href = data.checkoutUrl;
      }

    } catch (error: any) {
      console.error('[useAsaasPublicCheckout] Erro:', error);
      checkoutWindow?.close();
      toast({
        variant: "destructive",
        title: "Erro ao iniciar checkout",
        description: error.message || 'Tente novamente mais tarde',
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    startCheckout
  };
};
