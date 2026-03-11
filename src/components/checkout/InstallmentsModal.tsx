import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatAmountFromCents } from '@/types/payments';
import { CreditCard, Check } from 'lucide-react';

interface InstallmentsModalProps {
  open: boolean;
  onClose: () => void;
  amount: number; // em centavos
  maxInstallments: number;
  freeInstallments: number;
  interestRate: number | null;
  onConfirm: (installments: number) => void;
}

export const InstallmentsModal: React.FC<InstallmentsModalProps> = ({
  open,
  onClose,
  amount,
  maxInstallments,
  freeInstallments,
  interestRate,
  onConfirm
}) => {
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState<Array<{
    installments: number;
    amountPerInstallment: number;
    totalAmount: number;
    interestAmount: number;
    isFree: boolean;
  }>>([]);

  // Calcular opções de parcelamento
  useEffect(() => {
    const options = [];
    
    for (let i = 1; i <= maxInstallments; i++) {
      const isFree = i <= freeInstallments;
      let totalAmount = amount;
      let interestAmount = 0;
      
      if (!isFree && interestRate && interestRate > 0) {
        // Aplicar juros compostos
        const monthlyRate = interestRate / 100;
        totalAmount = amount * Math.pow(1 + monthlyRate, i);
        interestAmount = totalAmount - amount;
      }
      
      options.push({
        installments: i,
        amountPerInstallment: totalAmount / i,
        totalAmount: Math.round(totalAmount),
        interestAmount: Math.round(interestAmount),
        isFree
      });
    }
    
    setInstallmentOptions(options);
  }, [amount, maxInstallments, freeInstallments, interestRate]);

  const handleConfirm = () => {
    if (selectedInstallments >= 1 && selectedInstallments <= maxInstallments) {
      onConfirm(selectedInstallments);
    }
  };

  const selectedOption = installmentOptions.find(opt => opt.installments === selectedInstallments);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Escolha o Parcelamento
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Valor da compra: <span className="font-semibold">{formatAmountFromCents(amount)}</span>
          </div>
          
          <div className="max-h-60 overflow-y-auto space-y-2">
            {installmentOptions.map((option) => (
              <Card 
                key={option.installments}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedInstallments === option.installments 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-accent'
                }`}
                onClick={() => setSelectedInstallments(option.installments)}
              >
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {option.installments}x de {formatAmountFromCents(Math.round(option.amountPerInstallment))}
                      </span>
                      {option.isFree && (
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          sem juros
                        </span>
                      )}
                    </div>
                    
                    {!option.isFree && option.interestAmount > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Total: {formatAmountFromCents(option.totalAmount)} 
                        <span className="text-amber-600 ml-1">
                          (+{formatAmountFromCents(option.interestAmount)} juros)
                        </span>
                      </div>
                    )}
                  </div>
                  
                  {selectedInstallments === option.installments && (
                    <Check className="h-4 w-4 text-primary" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          {selectedOption && (
            <div className="bg-accent/50 p-3 rounded-lg">
              <div className="text-sm">
                <div className="font-medium">Resumo do parcelamento:</div>
                <div className="text-muted-foreground">
                  {selectedOption.installments}x de {formatAmountFromCents(Math.round(selectedOption.amountPerInstallment))}
                  {selectedOption.interestAmount > 0 && (
                    <span className="text-amber-600 ml-1">
                      (Total: {formatAmountFromCents(selectedOption.totalAmount)})
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Voltar
            </Button>
            <Button onClick={handleConfirm} className="flex-1">
              Continuar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};