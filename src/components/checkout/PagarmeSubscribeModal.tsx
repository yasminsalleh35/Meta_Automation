// ⚠️ DEPRECATED: Este componente usa Pagar.me SDK V1 (legado)
// ✅ Use /checkout (src/pages/checkout/index.tsx) para Pagar.me V5
// Este arquivo apenas retorna null para evitar erros

import React from 'react';

interface PagarmeSubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  planCode?: 'mensal' | 'anual';
  config?: any;
}

export const PagarmeSubscribeModal: React.FC<PagarmeSubscribeModalProps> = ({
  isOpen,
  onClose
}) => {
  React.useEffect(() => {
    if (isOpen) {
      console.warn('⚠️ [DEPRECATED] PagarmeSubscribeModal is deprecated. Redirecting to /checkout...');
      onClose();
      window.location.href = '/checkout';
    }
  }, [isOpen, onClose]);

  return null;
};
