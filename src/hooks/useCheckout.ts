
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSupabase } from '@/hooks/useSupabase';
import { openPaymentCheckout } from '@/lib/utils';

// ⚠️ DEPRECATED: Este hook está obsoleto
// ✅ Use usePagarmeCheckout para V5

export const useCheckout = () => {
  console.warn('⚠️ useCheckout is deprecated. Use usePagarmeCheckout instead.');
  
  return {
    createCheckoutSession: () => {
      throw new Error('useCheckout.createCheckoutSession is deprecated. Use usePagarmeCheckout.startPagarmeParcelado');
    },
    isLoading: false
  };
};
