// =============================================
// Tipos TypeScript para Integração Asaas
// API v3 - https://docs.asaas.com/reference
// =============================================

export type AsaasEnvironment = 'sandbox' | 'production';
export type AsaasBillingType = 'CREDIT_CARD' | 'BOLETO' | 'PIX' | 'UNDEFINED';
export type AsaasChargeType = 'RECURRENT' | 'DETACHED' | 'INSTALLMENT';
export type AsaasCycle = 'MONTHLY' | 'YEARLY' | 'WEEKLY' | 'BIMONTHLY' | 'QUARTERLY' | 'SEMIANNUALLY';
export type AsaasSubscriptionStatus = 'ACTIVE' | 'EXPIRED' | 'OVERDUE' | 'CANCELED';

// =============================================
// Configuração Asaas
// =============================================

export interface AsaasConfig {
  id: string;
  environment: AsaasEnvironment;
  api_key: string | null;
  webhook_secret: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AsaasConfigSafe {
  id: string;
  environment: AsaasEnvironment;
  is_active: boolean;
  has_api_key: boolean;
  has_webhook_secret: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// Planos Asaas
// =============================================

export interface AsaasPlan {
  id: string;
  internal_slug: string;
  name: string;
  description: string | null;
  amount: number;
  billing_type: AsaasBillingType;
  cycle: AsaasCycle;
  max_installment_count: number;
  charge_type: AsaasChargeType;
  environment: AsaasEnvironment;
  is_active: boolean;
  is_default_monthly: boolean;
  is_default_annual: boolean;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// =============================================
// Checkout Asaas
// =============================================

export interface AsaasCheckoutRequest {
  name: string;
  description?: string;
  billingTypes: AsaasBillingType[];
  chargeTypes: AsaasChargeType[];
  items: AsaasCheckoutItem[];
  callback?: {
    successUrl: string;
    cancelUrl: string;
    expiredUrl?: string;
  };
  subscription?: {
    cycle: AsaasCycle;
    nextDueDate: string;
    value: number;
    maxInstallmentCount?: number;
    description?: string;
  };
}

export interface AsaasCheckoutItem {
  name: string;
  description?: string;
  value: number;
  quantity?: number;
}

export interface AsaasCheckoutResponse {
  id: string;
  url: string;
  expirationDate: string;
  status: string;
}

// =============================================
// Subscription Asaas
// =============================================

export interface AsaasSubscriptionRequest {
  customer: string;
  billingType: AsaasBillingType;
  nextDueDate: string;
  value: number;
  cycle: AsaasCycle;
  description?: string;
  maxPayments?: number;
  externalReference?: string;
  split?: any[];
}

export interface AsaasSubscriptionResponse {
  id: string;
  customer: string;
  billingType: AsaasBillingType;
  cycle: AsaasCycle;
  value: number;
  nextDueDate: string;
  status: AsaasSubscriptionStatus;
  description?: string;
  externalReference?: string;
}

// =============================================
// Webhooks Asaas
// =============================================

export interface AsaasWebhookEvent {
  event: string;
  payment?: {
    id: string;
    customer: string;
    subscription?: string;
    billingType: AsaasBillingType;
    value: number;
    status: string;
    dueDate: string;
    confirmedDate?: string;
  };
  subscription?: {
    id: string;
    customer: string;
    billingType: AsaasBillingType;
    cycle: AsaasCycle;
    value: number;
    nextDueDate: string;
    status: AsaasSubscriptionStatus;
  };
}

// =============================================
// Validadores
// =============================================

export const ASAAS_CUSTOMER_ID_PATTERN = /^cus_[A-Za-z0-9]{10,}$/;
export const ASAAS_SUBSCRIPTION_ID_PATTERN = /^sub_[A-Za-z0-9]{10,}$/;
export const ASAAS_CHECKOUT_ID_PATTERN = /^[A-Za-z0-9]{10,}$/;

export function isValidAsaasCustomerId(id: string | null): boolean {
  return id ? ASAAS_CUSTOMER_ID_PATTERN.test(id) : false;
}

export function isValidAsaasSubscriptionId(id: string | null): boolean {
  return id ? ASAAS_SUBSCRIPTION_ID_PATTERN.test(id) : false;
}

export function getAsaasBaseUrl(environment: AsaasEnvironment): string {
  return environment === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://api-sandbox.asaas.com/v3';
}

export function formatAsaasAmount(amount: number): number {
  return parseFloat(amount.toFixed(2));
}
