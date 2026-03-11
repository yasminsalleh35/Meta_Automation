// =============================================
// Formulário de cartão com tokenização Pagar.me
// Implementa SAQ A (nunca armazena PAN)
// =============================================

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreditCard, Lock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CardFormPagarmeProps {
  publicKey: string;
  onTokenize: (token: string) => void;
  loading?: boolean;
  buttonText?: string;
}

interface CardData {
  number: string;
  holder_name: string;
  expiration_month: string;
  expiration_year: string;
  cvv: string;
}

// Declaração global para o script do Pagar.me
declare global {
  interface Window {
    PagarMe?: any;
  }
}

const CardFormPagarme: React.FC<CardFormPagarmeProps> = ({ 
  publicKey, 
  onTokenize, 
  loading = false,
  buttonText
}) => {
  const { toast } = useToast();
  const [cardData, setCardData] = useState<CardData>({
    number: '',
    holder_name: '',
    expiration_month: '',
    expiration_year: '',
    cvv: ''
  });
  
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [errors, setErrors] = useState<Partial<CardData>>({});

  // Carregar script do Pagar.me
  useEffect(() => {
    if (!publicKey) return;

    const script = document.createElement('script');
    script.src = 'https://assets.pagar.me/js/pagarme.min.js';
    script.async = true;
    script.onload = () => {
      if (window.PagarMe) {
        window.PagarMe.encryption_key = publicKey;
        setScriptLoaded(true);
      }
    };
    script.onerror = () => {
      console.error('Failed to load Pagar.me script');
      toast({
        title: "Erro ao carregar",
        description: "Não foi possível carregar o sistema de pagamentos.",
        variant: "destructive"
      });
    };
    
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [publicKey]);

  const validateCard = (): boolean => {
    const newErrors: Partial<CardData> = {};

    // Validar número do cartão (básico)
    const cleanNumber = cardData.number.replace(/\s/g, '');
    if (!cleanNumber || cleanNumber.length < 13 || cleanNumber.length > 19) {
      newErrors.number = 'Número do cartão inválido';
    }

    // Validar nome
    if (!cardData.holder_name.trim() || cardData.holder_name.trim().length < 2) {
      newErrors.holder_name = 'Nome do portador é obrigatório';
    }

    // Validar mês
    const month = parseInt(cardData.expiration_month);
    if (!month || month < 1 || month > 12) {
      newErrors.expiration_month = 'Mês inválido';
    }

    // Validar ano
    const year = parseInt(cardData.expiration_year);
    const currentYear = new Date().getFullYear();
    if (!year || year < currentYear || year > currentYear + 20) {
      newErrors.expiration_year = 'Ano inválido';
    }

    // Validar CVV
    if (!cardData.cvv || cardData.cvv.length < 3 || cardData.cvv.length > 4) {
      newErrors.cvv = 'CVV inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!scriptLoaded || !window.PagarMe?.createCardHash) {
      toast({
        title: "Sistema não carregado",
        description: "O sistema de pagamentos ainda não foi carregado. Tente novamente.",
        variant: "destructive"
      });
      return;
    }

    if (!validateCard()) {
      return;
    }

    setProcessing(true);

    try {
      // Preparar dados para tokenização
      const cardPayload = {
        card_number: cardData.number.replace(/\s/g, ''),
        card_holder_name: cardData.holder_name.trim(),
        card_expiration_date: `${cardData.expiration_month.padStart(2, '0')}${cardData.expiration_year}`,
        card_cvv: cardData.cvv
      };

      console.log('[CardFormPagarme] Tokenizing card...', {
        has_number: !!cardPayload.card_number,
        has_name: !!cardPayload.card_holder_name,
        expiration: cardPayload.card_expiration_date
      });

      // Criar card hash usando a biblioteca do Pagar.me
      const cardHash = await window.PagarMe.createCardHash!(cardPayload);

      console.log('[CardFormPagarme] Card tokenized successfully');

      // Limpar formulário por segurança
      setCardData({
        number: '',
        holder_name: '',
        expiration_month: '',
        expiration_year: '',
        cvv: ''
      });

      // Enviar token para o parent
      onTokenize(cardHash);

    } catch (error: any) {
      console.error('[CardFormPagarme] Tokenization error:', error);
      
      let errorMessage = 'Erro ao processar dados do cartão';
      
      if (error.message?.includes('invalid card number')) {
        errorMessage = 'Número do cartão inválido';
      } else if (error.message?.includes('invalid expiration')) {
        errorMessage = 'Data de validade inválida';
      } else if (error.message?.includes('invalid cvv')) {
        errorMessage = 'CVV inválido';
      }

      toast({
        title: "Erro no cartão",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleInputChange = (field: keyof CardData, value: string) => {
    let formattedValue = value;

    // Formatações específicas
    if (field === 'number') {
      // Formatação do número do cartão (espaços a cada 4 dígitos)
      formattedValue = value.replace(/\s/g, '').replace(/(.{4})/g, '$1 ').trim();
      if (formattedValue.length > 23) formattedValue = formattedValue.substring(0, 23); // 19 dígitos + 4 espaços
    } else if (field === 'expiration_month') {
      formattedValue = value.replace(/\D/g, '').substring(0, 2);
    } else if (field === 'expiration_year') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    } else if (field === 'holder_name') {
      formattedValue = value.toUpperCase();
    }

    setCardData(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Limpar erro do campo quando usuário digita
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  if (!scriptLoaded) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Carregando sistema de pagamentos...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <CreditCard className="w-5 h-5" />
          <span>Dados do Cartão</span>
          <Lock className="w-4 h-4 text-green-600" />
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Alert className="mb-6">
          <Lock className="h-4 w-4" />
          <AlertDescription>
            <strong>Pagamento Seguro:</strong> Seus dados são criptografados e nunca armazenados em nossos servidores.
            Processamento via Pagar.me com certificação PCI DSS.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Número do Cartão */}
          <div>
            <Label htmlFor="card_number">Número do Cartão</Label>
            <Input
              id="card_number"
              type="text"
              placeholder="0000 0000 0000 0000"
              value={cardData.number}
              onChange={(e) => handleInputChange('number', e.target.value)}
              className={errors.number ? 'border-red-500' : ''}
              maxLength={23}
            />
            {errors.number && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.number}
              </p>
            )}
          </div>

          {/* Nome do Portador */}
          <div>
            <Label htmlFor="holder_name">Nome do Portador</Label>
            <Input
              id="holder_name"
              type="text"
              placeholder="Nome conforme impresso no cartão"
              value={cardData.holder_name}
              onChange={(e) => handleInputChange('holder_name', e.target.value)}
              className={errors.holder_name ? 'border-red-500' : ''}
            />
            {errors.holder_name && (
              <p className="text-sm text-red-600 mt-1 flex items-center">
                <AlertCircle className="w-3 h-3 mr-1" />
                {errors.holder_name}
              </p>
            )}
          </div>

          {/* Validade e CVV */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="expiration_month">Mês</Label>
              <Input
                id="expiration_month"
                type="text"
                placeholder="MM"
                value={cardData.expiration_month}
                onChange={(e) => handleInputChange('expiration_month', e.target.value)}
                className={errors.expiration_month ? 'border-red-500' : ''}
                maxLength={2}
              />
              {errors.expiration_month && (
                <p className="text-xs text-red-600 mt-1">{errors.expiration_month}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="expiration_year">Ano</Label>
              <Input
                id="expiration_year"
                type="text"
                placeholder="AAAA"
                value={cardData.expiration_year}
                onChange={(e) => handleInputChange('expiration_year', e.target.value)}
                className={errors.expiration_year ? 'border-red-500' : ''}
                maxLength={4}
              />
              {errors.expiration_year && (
                <p className="text-xs text-red-600 mt-1">{errors.expiration_year}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="cvv">CVV</Label>
              <Input
                id="cvv"
                type="password"
                placeholder="123"
                value={cardData.cvv}
                onChange={(e) => handleInputChange('cvv', e.target.value)}
                className={errors.cvv ? 'border-red-500' : ''}
                maxLength={4}
              />
              {errors.cvv && (
                <p className="text-xs text-red-600 mt-1">{errors.cvv}</p>
              )}
            </div>
          </div>

          {/* Botão de Pagamento */}
          <Button
            type="submit"
            className="w-full"
            disabled={loading || processing}
          >
            {processing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processando...
              </>
            ) : loading ? (
              'Finalizando...'
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                {buttonText || 'Finalizar Pagamento'}
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CardFormPagarme;