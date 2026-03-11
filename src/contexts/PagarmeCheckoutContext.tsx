import React, { createContext, useContext } from 'react';
import { usePagarmeCheckout } from '@/hooks/usePagarmeCheckout';
import { InstallmentsModal } from '@/components/checkout/InstallmentsModal';

interface PagarmeCheckoutContextType {
  startPagarmeParcelado: (params: {
    amount: number;
    currency?: string;
    metadata?: Record<string, string>;
  }) => Promise<void>;
  loading: boolean;
}

const PagarmeCheckoutContext = createContext<PagarmeCheckoutContextType | null>(null);

export const usePagarmeCheckoutContext = () => {
  const context = useContext(PagarmeCheckoutContext);
  if (!context) {
    throw new Error('usePagarmeCheckoutContext must be used within PagarmeCheckoutProvider');
  }
  return context;
};

interface PagarmeCheckoutProviderProps {
  children: React.ReactNode;
}

export const PagarmeCheckoutProvider: React.FC<PagarmeCheckoutProviderProps> = ({ children }) => {
  const {
    loading,
    showInstallmentsModal,
    showCardModal,
    selectedInstallments,
    currentAmount,
    config,
    startPagarmeParcelado,
    handleInstallmentsSelected,
    handleCardTokenized,
    handleClose
  } = usePagarmeCheckout();

  const contextValue: PagarmeCheckoutContextType = {
    startPagarmeParcelado,
    loading
  };

  return (
    <PagarmeCheckoutContext.Provider value={contextValue}>
      {children}
      
      {/* Modal de parcelas mantido para compatibilidade */}
      {config && (
        <InstallmentsModal
          open={showInstallmentsModal}
          onClose={handleClose}
          amount={currentAmount}
          maxInstallments={config.installments_max}
          freeInstallments={config.free_installments}
          interestRate={config.interest_rate}
          onConfirm={handleInstallmentsSelected}
        />
      )}
    </PagarmeCheckoutContext.Provider>
  );
};