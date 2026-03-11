// =============================================
// Modal de Checkout Pagar.me V5 - tokenizecard.js
// Tokenização oficial via https://checkout.pagar.me/v1/tokenizecard.js
// =============================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Shield, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { extractV5Token, isValidV5Token, buildSubscribeBody, formatPhoneDisplay, formatCardNumber } from '@/lib/pagarmeV5Helpers';

// Declaração global do PagarmeCheckout V5
declare global {
  interface Window {
    PagarmeCheckout?: {
      init: (successCallback: (data: any) => void, failCallback: (error: any) => void) => void;
      _initialized?: boolean;
    };
  }
}

interface PagarmeCheckoutModalV5Props {
  open: boolean;
  onClose: () => void;
  planCode: 'mensal' | 'anual';
  publicKey: string;
  environment: 'test' | 'live';
}

export const PagarmeCheckoutModalV5: React.FC<PagarmeCheckoutModalV5Props> = ({
  open,
  onClose,
  planCode,
  publicKey,
  environment
}) => {
  const [loading, setLoading] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [pagarmeToken, setPagarmeToken] = useState<string | null>(null);
  const [formValid, setFormValid] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    document: '',
    holder_name: '',
    card_number: '',
    exp_month: '',
    exp_year: '',
    cvv: '',
    // ✅ Campos de endereço (billing)
    zipCode: '',
    street: '',
    number: '',
    city: '',
    state: ''
  });
  
  const formRef = useRef<HTMLFormElement>(null);
  const sdkTokenPayloadRef = useRef<any>(null); // Armazena payload completo do SDK
  const { toast } = useToast();

  const planDetails = {
    mensal: {
      name: 'Plano Mensal',
      amount: 34999,
      installments: 1,
      displayPrice: 'R$ 349,99/mês'
    },
    anual: {
      name: 'Plano Anual',
      amount: 249900,
      installments: 12,
      displayPrice: 'R$ 2.499,00 (12x R$ 208,25)'
    }
  };

  const plan = planDetails[planCode];

  // Validar formulário para habilitar botão
  useEffect(() => {
    const phoneDigits = formData.phone.replace(/\D/g, '');
    const cardDigits = formData.card_number.replace(/\D/g, '');
    const documentDigits = formData.document.replace(/\D/g, '');
    const zipDigits = formData.zipCode.replace(/\D/g, '');
    
    const isValid = 
      formData.name.trim().length >= 3 &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email?.trim() || '') &&
      phoneDigits.length >= 10 && phoneDigits.length <= 11 &&
      documentDigits.length === 11 &&
      formData.holder_name.trim().length > 0 &&
      cardDigits.length === 16 &&
      formData.exp_month.length === 2 &&
      formData.exp_year.length === 4 &&
      formData.cvv.length >= 3 &&
      // ✅ Validação de endereço
      zipDigits.length === 8 &&
      formData.street.trim().length >= 3 &&
      formData.number.trim().length >= 1 &&
      formData.city.trim().length >= 2 &&
      formData.state.length === 2;
    
    setFormValid(isValid && (pagarmeToken ? /^token_[A-Za-z0-9]{10,}$/.test(pagarmeToken) : true));
  }, [formData, pagarmeToken]);

  // Carregar tokenizecard.js da Pagar.me V5
  useEffect(() => {
    if (!open || !publicKey) return;

    const scriptId = 'pagarme-tokenizecard-v5';
    
    // Validar Public Key (V5 usa apenas 'pk_' como prefixo)
    const isValidPk = publicKey.startsWith('pk_') && publicKey.length >= 10;
    if (!isValidPk) {
      console.error('[pagarme-v5] ❌ Public Key inválida');
      toast({
        variant: "destructive",
        title: "Erro de Configuração",
        description: "Public Key inválida"
      });
      return;
    }

    // Se já existe, apenas verificar se PagarmeCheckout está disponível
    if (document.getElementById(scriptId)) {
      console.log('[pagarme-v5] Script já carregado');
      
      const checkPagarmeCheckout = (attempts = 0) => {
        if (window.PagarmeCheckout) {
          console.log('[pagarme-v5] ✓ window.PagarmeCheckout disponível');
          setSdkLoaded(true);
        } else if (attempts < 5) {
          setTimeout(() => checkPagarmeCheckout(attempts + 1), 300);
        } else {
          console.error('[pagarme-v5] ❌ window.PagarmeCheckout não disponível');
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível iniciar o sistema de pagamento"
          });
        }
      };
      
      checkPagarmeCheckout();
      return;
    }

    // Criar e carregar o script com a public key
    console.log('[pagarme-v5] Carregando SDK com public key...');
    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://checkout.pagar.me/v1/tokenizecard.js';
    script.setAttribute('data-pagarmecheckout-app-id', publicKey);
    script.async = true;
    
    script.onload = () => {
      console.log('[pagarme-v5] ✓ SDK loaded');
      
      const checkAvailability = (attempts = 0) => {
        if (window.PagarmeCheckout) {
          console.log('[pagarme-v5] ✓ window.PagarmeCheckout disponível');
          setSdkLoaded(true);
        } else if (attempts < 5) {
          setTimeout(() => checkAvailability(attempts + 1), 200);
        } else {
          console.error('[pagarme-v5] ❌ window.PagarmeCheckout não encontrado após load');
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível iniciar o sistema de pagamento"
          });
        }
      };
      checkAvailability();
    };
    
    script.onerror = () => {
      console.error('[pagarme-v5] ❌ Falha ao carregar SDK');
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Falha ao carregar sistema de pagamento"
      });
    };
    
    document.body.appendChild(script);

    return () => {
      setPagarmeToken(null);
    };
  }, [open, publicKey, toast]);

  // Inicializar PagarmeCheckout.init() quando SDK estiver pronto e modal aberto
  useEffect(() => {
    if (!sdkLoaded || !window.PagarmeCheckout || !open) return;
    if (window.PagarmeCheckout._initialized) return;

    // Aguardar o DOM estar completamente pronto (campos mapeados devem existir)
    const initTimer = setTimeout(() => {
      // Verificar se elementos obrigatórios existem
      const form = document.querySelector('[data-pagarmecheckout-form]');
      const holderInput = document.querySelector('[data-pagarmecheckout-element="holder_name"]');
      const numberInput = document.querySelector('[data-pagarmecheckout-element="number"]');
      
      if (!form || !holderInput || !numberInput) {
        console.error('[pagarme-v5] ❌ Elementos obrigatórios não encontrados no DOM');
        return;
      }

      console.log('[pagarme-v5] Inicializando PagarmeCheckout.init()...');
      console.log('[pagarme-v5] Elementos mapeados encontrados:', { form, holderInput, numberInput });

      const onTokenizeSuccess = (data: any) => {
        console.log('[pagarme-v5] ✅ SDK tokenization callback triggered:', data);
        
        // Extract token from hidden input (SDK V5 places it there with name="pagarmetoken-X")
        const formEl = document.querySelector('[data-pagarmecheckout-form]') as HTMLFormElement;
        const tokenInput = formEl?.querySelector<HTMLInputElement>('input[name^="pagarmetoken"]');
        const tokenId = extractV5Token({ 
          token: tokenInput?.value?.trim(),
          id: data?.id,
          'pagarmetoken-0': tokenInput?.value?.trim()
        });
        
        // Extrair dados que o SDK capturou dos inputs (incluindo endereço)
        const sdkData = {
          name: data?.buyer_name || '',
          email: data?.buyer_email || '',
          phone: data?.buyer_phone || '',
          address: {
            zipCode: data?.['buyer_address[zip_code]'] || '',
            street: data?.['buyer_address[line_1]'] || '',
            number: data?.['buyer_address[number]'] || '',
            city: data?.['buyer_address[city]'] || '',
            state: data?.['buyer_address[state]'] || ''
          }
        };
        
        console.log('[pagarme-v5] Dados capturados pelo SDK:', sdkData);
        console.log('[pagarme-v5] Comparação React state vs SDK:', {
          react: { 
            name: formData.name, 
            email: formData.email, 
            phone: formData.phone,
            address: {
              zipCode: formData.zipCode,
              street: formData.street,
              number: formData.number,
              city: formData.city,
              state: formData.state
            }
          },
          sdk: sdkData
        });
        
        // Armazenar payload completo do SDK
        sdkTokenPayloadRef.current = {
          token: tokenInput?.value?.trim(),
          id: data?.id,
          'pagarmetoken-0': tokenInput?.value?.trim(),
          ...data
        };
        
        console.log('[pagarme-v5] Token extraction:', { 
          found: !!tokenId,
          token_prefix: tokenId?.substring(0, 12),
          input_name: tokenInput?.name
        });
        
        // Validate V5 token format using helper
        if (!isValidV5Token(tokenId)) {
          console.error('[pagarme-v5] ❌ Token V5 inválido', { 
            found: tokenId,
            all_hidden_inputs: Array.from(formEl?.querySelectorAll('input[type="hidden"]') || [])
              .map((i: any) => ({ name: i.name, value: i.value?.substring(0, 12) }))
          });
          toast({
            variant: "destructive",
            title: "Erro na tokenização",
            description: "Não foi possível tokenizar o cartão. Tente novamente."
          });
          setLoading(false);
          return false;
        }
        
        console.log('[pagarme-v5] ✓ Token V5 válido extraído, processando assinatura...');
        setPagarmeToken(tokenId);
        
        // Passar os dados capturados pelo SDK (incluindo endereço)
        handleSubscribeWithToken(tokenId, sdkData);
        
        return false; // Prevent default form submission
      };

      const onTokenizeFail = (error: any) => {
        console.error('[pagarme-v5] ❌ Tokenização falhou:', error);
        
        const errorMessage = error?.message || '';
        const isCSPError = errorMessage.includes('Refused to connect') || errorMessage.includes('CSP');
        
        toast({
          variant: "destructive",
          title: "Erro na Tokenização",
          description: isCSPError 
            ? 'Erro de configuração. Tente recarregar a página (Ctrl+Shift+R).'
            : 'Não foi possível tokenizar o cartão. Verifique os dados e tente novamente.'
        });
        
        setLoading(false);
      };

      try {
        window.PagarmeCheckout.init(onTokenizeSuccess, onTokenizeFail);
        window.PagarmeCheckout._initialized = true;
        console.log('[pagarme-v5] ✓ init chamado com sucesso');
      } catch (error) {
        console.error('[pagarme-v5] ❌ Erro ao chamar init():', error);
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Falha ao inicializar sistema de pagamento"
        });
      }
    }, 150);

    return () => clearTimeout(initTimer);
  }, [sdkLoaded, open, toast]);

  // Reset ao fechar modal
  useEffect(() => {
    if (!open) {
      setFormData({ 
        name: '', 
        email: '', 
        phone: '',
        document: '',
        holder_name: '', 
        card_number: '', 
        exp_month: '', 
        exp_year: '', 
        cvv: '',
        zipCode: '',
        street: '',
        number: '',
        city: '',
        state: ''
      });
      setPagarmeToken(null);
      setFormValid(false);
      setLoading(false);
      if (window.PagarmeCheckout) {
        window.PagarmeCheckout._initialized = false;
      }
    }
  }, [open]);

  const handleSubscribeWithToken = async (token: string, sdkData?: { name: string; email: string; phone: string; address?: { zipCode: string; street: string; number: string; city: string; state: string } }) => {
    // Usar dados do SDK (se disponíveis) ou fallback para formData
    const buyerData = sdkData || formData;
    
    // ✅ CORREÇÃO: Extrair document do payload completo do SDK
    const documentFromSdk = sdkTokenPayloadRef.current?.buyer_document || formData.document;
    
    console.log('[pagarme-v5] Document extraction:', {
      from_sdk: sdkTokenPayloadRef.current?.buyer_document,
      from_formData: formData.document,
      using: documentFromSdk
    });
    
    console.log('[pagarme-v5] Dados usados para validação:', buyerData);
    
    // Usar buildSubscribeBody para validação centralizada
    const validationResult = buildSubscribeBody({
      env: environment,
      planId: planCode,
      installments: plan.installments,
      name: buyerData.name,
      email: buyerData.email,
      phone: buyerData.phone,
      document: documentFromSdk,  // ✅ Prioriza SDK
      address: {
        zipCode: sdkData?.address?.zipCode || formData.zipCode,
        street: sdkData?.address?.street || formData.street,
        number: sdkData?.address?.number || formData.number,
        city: sdkData?.address?.city || formData.city,
        state: sdkData?.address?.state || formData.state
      },
      sdkTokenPayload: sdkTokenPayloadRef.current || { token }
    });

    // Type narrowing explícito
    if (validationResult.ok === false) {
      console.warn('[pagarme-v5] Validação bloqueada:', validationResult.errors);
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: `Corrija os campos: ${validationResult.errors.join('; ')}`
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    
    // Agora TypeScript sabe que validationResult.ok === true
    const payload = validationResult.body;
    
    console.log('[pagarme-v5] ✓ Validação passou, enviando request →', {
      plan_id: payload.plan_id,
      hasToken: true,
      buyer: payload.buyer
    });

    try {
      const { data, error } = await supabase.functions.invoke('pagarme-subscribe', {
        body: payload
      });

      setLoading(false);

      // Tratar status pending
      if (data?.ok && data?.status === 'pending') {
        console.log('[pagarme-v5] ⏳ Pagamento pendente:', data);
        toast({
          title: "⏳ Pagamento em Processamento",
          description: data?.hint || 'Você receberá um e-mail quando for aprovado.',
          duration: 5000
        });
        return; // Não fechar modal, permitir nova tentativa
      }

      if (error || !data?.ok) {
        console.error('[pagarme-v5] ❌ Erro na assinatura:', {
          error: data?.error,
          details: data?.details,
          status: data?.status
        });
        
        // Erro 412: Plano não configurado
        if (data?.error === 'PLAN_ID_MISSING') {
          const env = data?.details?.environment || 'atual';
          toast({
            variant: "destructive",
            title: "Configuração Pendente",
            description: data?.details?.hint || `Configure os planos V5 no ambiente ${env}.`,
            duration: 8000
          });
          return;
        }
        
        // Erro 422: Validação (token, installments, etc.)
        if (data?.error === 'CARD_TOKEN_INVALID' || data?.error === 'INSTALLMENTS_NOT_ALLOWED') {
          toast({
            variant: "destructive",
            title: "Dados Inválidos",
            description: data?.details?.hint || 'Verifique os dados e tente novamente.',
            duration: 6000
          });
          return;
        }
        
        // Erro 402/failed: Pagamento recusado
        const errorTitle = data?.status === 'pending' 
          ? '⏳ Pagamento em Análise'
          : '❌ Pagamento Recusado';
        
        const errorDescription = data?.hint || data?.acquirer_message || data?.message || 'Tente novamente ou use outro cartão';
        
        const errorDetails = data?.acquirer_code 
          ? `\n\nCódigo: ${data.acquirer_code}` 
          : '';
        
        toast({
          variant: data?.status === 'pending' ? 'default' : 'destructive',
          title: errorTitle,
          description: errorDescription + errorDetails,
          duration: data?.status === 'pending' ? 5000 : 8000
        });
        
        return;
      }

      // Sucesso
      console.log('[pagarme-v5] ✅ subscription ok:', data);
      toast({
        title: "Assinatura criada com sucesso! 🎉",
        description: "Você receberá um e-mail com as instruções para acessar sua conta."
      });
      
      setTimeout(() => {
        window.location.href = `/checkout/success?session_id=${data.subscription_id}`;
      }, 500);

    } catch (error: any) {
      console.error('[pagarme-v5] ❌ subscribe failed:', error);
      setLoading(false);
      
      toast({
        variant: "destructive",
        title: "Erro na Assinatura",
        description: error.message || 'Tente novamente'
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação dos campos
    if (!formValid) {
      toast({
        variant: "destructive",
        title: "Dados incompletos",
        description: "Preencha todos os campos corretamente"
      });
      return;
    }

    console.log('[pagarme-v5] Form submitted, aguardando tokenização pelo SDK...');
    setLoading(true);
    // O SDK PagarmeCheckout intercepta o submit e chama onTokenizeSuccess com o token
  };

  // Função para buscar endereço pelo CEP usando ViaCEP
  const fetchAddressByCEP = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) return;
    
    setLoading(true);
    
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar CEP');
      }
      
      const data = await response.json();
      
      if (data.erro) {
        toast({
          variant: "destructive",
          title: "CEP não encontrado",
          description: "Por favor, verifique o CEP informado."
        });
        return;
      }
      
      // Preencher campos automaticamente
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || '',
        city: data.localidade || '',
        state: data.uf || ''
      }));
      
      toast({
        title: "Endereço encontrado!",
        description: "Os campos foram preenchidos automaticamente."
      });
      
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível buscar o endereço. Tente novamente."
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    let processedValue = value;
    
    if (field === 'phone') {
      processedValue = formatPhoneDisplay(value);
    } else if (field === 'zipCode') {
      // Formatar CEP: 00000-000
      const digits = value.replace(/\D/g, '').slice(0, 8);
      processedValue = digits.length > 5 
        ? `${digits.slice(0, 5)}-${digits.slice(5)}` 
        : digits;
      
      // Buscar endereço quando CEP completo (8 dígitos)
      if (digits.length === 8) {
        fetchAddressByCEP(digits);
      }
    } else if (field === 'state') {
      // Estado: apenas 2 letras maiúsculas
      processedValue = value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 2);
    } else if (field === 'document') {
      // Formatar CPF: 000.000.000-00
      const digits = value.replace(/\D/g, '').slice(0, 11);
      if (digits.length <= 3) {
        processedValue = digits;
      } else if (digits.length <= 6) {
        processedValue = `${digits.slice(0, 3)}.${digits.slice(3)}`;
      } else if (digits.length <= 9) {
        processedValue = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
      } else {
        processedValue = `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
      }
    } else if (field === 'card_number') {
      processedValue = formatCardNumber(value);
    } else if (field === 'exp_month') {
      processedValue = value.replace(/\D/g, '').slice(0, 2);
    } else if (field === 'exp_year') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
    } else if (field === 'cvv') {
      processedValue = value.replace(/\D/g, '').slice(0, 4);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Checkout - {plan.name}
          </DialogTitle>
        </DialogHeader>

        <form ref={formRef} data-pagarmecheckout-form onSubmit={handleSubmit} className="space-y-4">
          {/* Informações do Plano */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{plan.name}</p>
                <p className="text-sm text-gray-600">{plan.displayPrice}</p>
              </div>
              <Shield className="h-6 w-6 text-green-600" />
            </div>
            {planCode === 'anual' && (
              <p className="text-xs text-green-600 mt-2 font-medium">
                💰 Economize R$ 1.700 no plano anual!
              </p>
            )}
          </div>

          {/* Dados Pessoais */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Dados Pessoais</h3>
            <div>
              <Label htmlFor="buyer_name">Nome Completo *</Label>
              <Input
                id="buyer_name"
                name="buyer_name"
                placeholder="Seu nome completo"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="buyer_email">E-mail *</Label>
              <Input
                id="buyer_email"
                name="buyer_email"
                type="email"
                placeholder="seu@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="buyer_phone">Telefone (com DDD) *</Label>
              <Input
                id="buyer_phone"
                name="buyer_phone"
                placeholder="(11) 99999-9999"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="buyer_document">CPF *</Label>
              <Input
                id="buyer_document"
                name="buyer_document"
                placeholder="000.000.000-00"
                value={formData.document}
                onChange={(e) => handleInputChange('document', e.target.value)}
                maxLength={14}
                required
              />
            </div>
          </div>

          {/* Endereço de Cobrança */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Endereço de Cobrança</h3>
            <div>
              <Label htmlFor="zipCode">CEP *</Label>
              <div className="relative">
                <Input
                  id="zipCode"
                  placeholder="00000-000"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  maxLength={9}
                  required
                  disabled={loading}
                />
                {loading && formData.zipCode.replace(/\D/g, '').length === 8 && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-primary" />
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Digite o CEP e o endereço será preenchido automaticamente
              </p>
            </div>
            <div>
              <Label htmlFor="street">Endereço *</Label>
              <Input
                id="street"
                placeholder="Rua, Avenida, etc."
                value={formData.street}
                onChange={(e) => handleInputChange('street', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="number">Número *</Label>
              <Input
                id="number"
                placeholder="Número"
                value={formData.number}
                onChange={(e) => handleInputChange('number', e.target.value)}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  placeholder="Nome da cidade"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">UF *</Label>
                <Input
                  id="state"
                  placeholder="MG"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  maxLength={2}
                  required
                />
              </div>
            </div>
          </div>

          {/* Dados do Cartão */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm text-gray-700">Dados do Cartão</h3>
            <div>
              <Label htmlFor="card_holder_name">Nome no Cartão *</Label>
              <Input
                id="card_holder_name"
                data-pagarmecheckout-element="holder_name"
                placeholder="Nome como está no cartão"
                value={formData.holder_name}
                onChange={(e) => handleInputChange('holder_name', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="card_number">Número do Cartão *</Label>
              <Input
                id="card_number"
                data-pagarmecheckout-element="number"
                placeholder="0000 0000 0000 0000"
                value={formData.card_number}
                onChange={(e) => handleInputChange('card_number', e.target.value)}
                maxLength={19}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="exp_month">Mês *</Label>
                <Input
                  id="exp_month"
                  data-pagarmecheckout-element="exp_month"
                  placeholder="MM"
                  value={formData.exp_month}
                  onChange={(e) => handleInputChange('exp_month', e.target.value)}
                  maxLength={2}
                  required
                />
              </div>
              <div>
                <Label htmlFor="exp_year">Ano *</Label>
                <Input
                  id="exp_year"
                  data-pagarmecheckout-element="exp_year"
                  placeholder="AAAA"
                  value={formData.exp_year}
                  onChange={(e) => handleInputChange('exp_year', e.target.value)}
                  maxLength={4}
                  required
                />
              </div>
              <div>
                <Label htmlFor="cvv">CVV *</Label>
                <Input
                  id="cvv"
                  data-pagarmecheckout-element="cvv"
                  placeholder="123"
                  value={formData.cvv}
                  onChange={(e) => handleInputChange('cvv', e.target.value)}
                  maxLength={4}
                  required
                />
              </div>
          </div>
        </div>

        {/* Campos hidden para SDK V5 capturar dados de endereço */}
        <input 
          type="hidden" 
          name="buyer_address[zip_code]" 
          value={formData.zipCode.replace(/\D/g, '')} 
        />
        <input 
          type="hidden" 
          name="buyer_address[line_1]" 
          value={formData.street} 
        />
        <input 
          type="hidden" 
          name="buyer_address[number]" 
          value={formData.number} 
        />
        <input 
          type="hidden" 
          name="buyer_address[city]" 
          value={formData.city} 
        />
        <input 
          type="hidden" 
          name="buyer_address[state]" 
          value={formData.state} 
        />
        <input 
          type="hidden" 
          name="buyer_address[country]" 
          value="BR" 
        />

        {/* Status do SDK */}
        <div className="text-xs text-gray-500 space-y-1">
            {!sdkLoaded && <p>⏳ Carregando sistema de pagamento...</p>}
            {sdkLoaded && <p className="text-green-600">✓ Sistema de pagamento pronto</p>}
            {formValid && sdkLoaded && <p className="text-blue-600">✓ Formulário válido - pronto para processar</p>}
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={!formValid || loading || !sdkLoaded}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : (
                <>Confirmar - {plan.displayPrice.split(' ')[1]}</>
              )}
            </Button>
          </div>

          {/* Segurança */}
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
            <Shield className="h-3 w-3" />
            <span>Pagamento 100% seguro via Pagar.me</span>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
