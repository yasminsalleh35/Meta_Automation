// =============================================
// Tipos TypeScript para Integração Híbrida
// Stripe + Pagar.me via Custom Payment Methods
// =============================================

export type PaymentProvider = 'stripe' | 'pagarme' | 'asaas';
export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'refused' | 'refunded' | 'chargeback';
export type PaymentMotive = 'subscription' | 'one_time' | 'parcelado';
export type PaymentEnvironment = 'test' | 'live';

// =============================================
// Interfaces Pagar.me
// =============================================

export interface PagarmeConfig {
  id: string;
  environment: PaymentEnvironment;
  public_key: string | null;
  secret_key?: string | null; // Nunca exposta no frontend
  encryption_key?: string | null;
  webhook_secret?: string | null;
  account_id?: string | null; // ID da conta Pagar.me (recipient)
  stripe_custom_payment_method_id: string | null; // cpmt_... para integração híbrida
  installments_max: number;
  free_installments: number;
  interest_rate: number | null;
  statement_descriptor: string | null;
  created_at: string;
  updated_at: string;
  has_secret_key?: boolean; // Indicador seguro
  has_webhook_secret?: boolean; // Indicador seguro
}

export interface PagarmeConfigSafe {
  id: string;
  environment: PaymentEnvironment;
  public_key: string | null;
  account_id: string | null; // ID da conta Pagar.me (recipient)
  stripe_custom_payment_method_id: string | null;
  installments_max: number;
  free_installments: number;
  interest_rate: number | null;
  statement_descriptor: string | null;
  created_at: string;
  updated_at: string;
  has_secret_key: boolean;
  has_webhook_secret: boolean;
}

// =============================================
// Requests/Responses Edge Functions
// =============================================

export interface PagarmeInitRequest {
  amount: number; // centavos
  currency: 'BRL';
  installments: number;
  metadata?: Record<string, string>;
  motive?: PaymentMotive;
  user_context?: {
    user_id?: string;
    campaign_id?: string;
    order_id?: string;
  };
  card_token?: string; // Token do cartão gerado no frontend
  card_hash?: string;  // Hash do cartão (formato alternativo)
}

export interface PagarmeInitResponse {
  success: boolean;
  data?: {
    status: PaymentStatus;
    external_id: string;
    receipt_url?: string;
    installment_info?: {
      installments: number;
      amount_per_installment: number;
      total_amount: number;
      interest_amount: number;
    };
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface PagarmeTestConnectionResponse {
  success: boolean;
  data?: {
    environment: PaymentEnvironment;
    account_id?: string;
  };
  error?: {
    code: string;
    message: string;
  };
}

// =============================================
// Tabela unificada de pagamentos
// =============================================

export interface Payment {
  id: string;
  user_id: string | null;
  provider: PaymentProvider;
  motive: PaymentMotive | null;
  amount: number; // centavos
  currency: string;
  installments: number | null;
  fee: number | null; // centavos
  net_amount: number | null; // centavos
  status: PaymentStatus | null;
  external_id: string | null;
  external_raw: Record<string, any>;
  cpmt_id: string | null; // cpmt_* quando via Custom Payment Method
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface PaymentAuditLog {
  id: string;
  source: 'admin_save' | 'webhook' | 'init' | 'capture' | 'refund';
  provider: PaymentProvider;
  ref_id: string | null;
  message: string;
  metadata: Record<string, any>;
  created_at: string;
}

// =============================================
// Configurações unificadas (Stripe + Pagar.me)
// =============================================

export interface StripeConfig {
  id: string;
  publishable_key: string | null;
  secret_key?: string | null;
  webhook_secret?: string | null;
  environment: PaymentEnvironment;
  created_at: string;
  updated_at: string;
  has_webhook_secret?: boolean;
}

export interface PaymentsConfig {
  stripe: StripeConfig | null;
  pagarme: PagarmeConfigSafe | null;
}

// =============================================
// Custom Payment Method (Stripe Elements)
// =============================================

export interface StripeCustomPaymentMethodOption {
  id: string; // cpmt_...
  options: {
    type: 'static' | 'dynamic';
    subtitle: string;
    description?: string;
  };
}

// =============================================
// Webhook Pagar.me
// =============================================

export interface PagarmeWebhookEvent {
  id: string;
  object: string;
  type: string;
  data: {
    object: any; // Transaction ou outro objeto
  };
  created_at: string;
}

export interface PagarmeEventLog {
  id: string;
  event_id: string;
  event_type: string;
  processed: boolean;
  processed_at: string | null;
  raw_data: Record<string, any>;
  created_at: string;
}

// =============================================
// Utilitários e Validators
// =============================================

export interface InstallmentCalculation {
  installments: number;
  amount_per_installment: number;
  total_amount: number;
  interest_rate: number;
  interest_amount: number;
  free_installments: number;
}

export const CPMT_ID_PATTERN = /^cpmt_[a-zA-Z0-9]{24,}$/;
export const PAGARME_PUBLIC_KEY_PATTERN = /^pk_(test|live)_[a-zA-Z0-9]+$/;
export const PAGARME_SECRET_KEY_PATTERN = /^sk_(test|live)_[a-zA-Z0-9]+$/;

// Validators
export const isValidCpmtId = (id: string): boolean => CPMT_ID_PATTERN.test(id);
export const isValidPagarmePublicKey = (key: string): boolean => PAGARME_PUBLIC_KEY_PATTERN.test(key);
export const isValidPagarmeSecretKey = (key: string): boolean => PAGARME_SECRET_KEY_PATTERN.test(key);

// Environment helpers
export const getPagarmeKeyEnvironment = (key: string): PaymentEnvironment | null => {
  if (key.startsWith('pk_test_') || key.startsWith('sk_test_')) return 'test';
  if (key.startsWith('pk_live_') || key.startsWith('sk_live_')) return 'live';
  return null;
};

// Amount helpers
export const formatAmountFromCents = (cents: number): string => {
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  });
};

export const formatAmountToCents = (amount: number): number => {
  return Math.round(amount * 100);
};

// Re-exportar tipos Asaas para facilitar imports
export type { 
  AsaasEnvironment,
  AsaasBillingType,
  AsaasChargeType,
  AsaasCycle,
  AsaasSubscriptionStatus,
  AsaasConfig,
  AsaasConfigSafe,
  AsaasPlan,
  AsaasCheckoutRequest,
  AsaasCheckoutResponse,
  AsaasSubscriptionRequest,
  AsaasSubscriptionResponse,
  AsaasWebhookEvent
} from './asaas';