// =============================================
// Seletor de parcelas para checkout Pagar.me
// =============================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calculator, CreditCard } from 'lucide-react';

interface Installment {
  number: number;
  amount: number;
  total: number;
  interest: number;
  isFree: boolean;
}

interface InstallmentsPickerProps {
  amount: number;
  maxInstallments: number;
  freeInstallments: number;
  interestRate: number;
  onInstallmentSelect: (installments: number) => void;
}

const InstallmentsPicker: React.FC<InstallmentsPickerProps> = ({
  amount,
  maxInstallments,
  freeInstallments,
  interestRate,
  onInstallmentSelect
}) => {
  const [selectedInstallments, setSelectedInstallments] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState<Installment[]>([]);

  useEffect(() => {
    calculateInstallments();
  }, [amount, maxInstallments, freeInstallments, interestRate]);

  const calculateInstallments = () => {
    const options: Installment[] = [];
    const monthlyRate = interestRate / 100;

    for (let i = 1; i <= maxInstallments; i++) {
      if (i <= freeInstallments) {
        // Sem juros
        options.push({
          number: i,
          amount: amount / i,
          total: amount,
          interest: 0,
          isFree: true
        });
      } else {
        // Com juros compostos
        const total = amount * Math.pow(1 + monthlyRate, i);
        options.push({
          number: i,
          amount: total / i,
          total: total,
          interest: total - amount,
          isFree: false
        });
      }
    }

    setInstallmentOptions(options);
  };

  const handleInstallmentSelect = (installments: number) => {
    setSelectedInstallments(installments);
    onInstallmentSelect(installments);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="w-5 h-5" />
          <span>Escolha as Parcelas</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {installmentOptions.map((option) => (
            <Button
              key={option.number}
              variant={selectedInstallments === option.number ? "default" : "outline"}
              onClick={() => handleInstallmentSelect(option.number)}
              className={`h-auto p-4 flex flex-col items-start space-y-1 ${
                selectedInstallments === option.number ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">
                  {option.number}x {formatCurrency(option.amount)}
                </span>
                {option.isFree && (
                  <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                    Sem juros
                  </Badge>
                )}
              </div>
              
              <div className="text-xs text-left w-full">
                <div className="text-gray-600">
                  Total: {formatCurrency(option.total)}
                </div>
                {!option.isFree && option.interest > 0 && (
                  <div className="text-orange-600">
                    Juros: {formatCurrency(option.interest)}
                  </div>
                )}
              </div>
            </Button>
          ))}
        </div>

        {/* Informações do parcelamento selecionado */}
        {selectedInstallments > 1 && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CreditCard className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-900">Resumo do Parcelamento</span>
            </div>
            
            {(() => {
              const selected = installmentOptions.find(opt => opt.number === selectedInstallments);
              if (!selected) return null;
              
              return (
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Parcelas:</span>
                    <span className="font-medium">
                      {selected.number}x de {formatCurrency(selected.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span className="font-medium">{formatCurrency(selected.total)}</span>
                  </div>
                  {!selected.isFree && selected.interest > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>Juros ({interestRate}% a.m.):</span>
                      <span className="font-medium">+ {formatCurrency(selected.interest)}</span>
                    </div>
                  )}
                  {selected.isFree && (
                    <div className="text-green-600 font-medium">
                      ✅ Sem juros
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default InstallmentsPicker;