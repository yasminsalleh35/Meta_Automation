import { 
  AsaasEnvironment, 
  AsaasCheckoutRequest, 
  AsaasCheckoutResponse,
  AsaasSubscriptionRequest,
  AsaasSubscriptionResponse,
  getAsaasBaseUrl,
  formatAsaasAmount
} from '@/types/asaas';

// =============================================
// Client para comunicação com Asaas API v3
// Documentação: https://docs.asaas.com/reference
// =============================================

export class AsaasClient {
  private apiKey: string;
  private baseURL: string;

  constructor(apiKey: string, environment: AsaasEnvironment = 'sandbox') {
    if (!apiKey) {
      throw new Error('Asaas API Key é obrigatória');
    }
    
    this.apiKey = apiKey;
    this.baseURL = getAsaasBaseUrl(environment);
  }

  private getHeaders(): HeadersInit {
    return {
      'access_token': this.apiKey,
      'Content-Type': 'application/json',
      'User-Agent': 'camply-saas/1.0'
    };
  }

  private async request<T>(
    endpoint: string, 
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET', 
    body?: any
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`[AsaasClient] ${method} ${url}`);
    
    try {
      const response = await fetch(url, {
        method,
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('[AsaasClient] Error response:', data);
        throw new Error(
          data.errors?.[0]?.description || 
          data.message || 
          `Asaas API error: ${response.status}`
        );
      }

      return data as T;
    } catch (error) {
      console.error('[AsaasClient] Request failed:', error);
      throw error;
    }
  }

  async createRecurringCheckout(options: AsaasCheckoutRequest): Promise<AsaasCheckoutResponse> {
    console.log('[AsaasClient] Creating recurring checkout:', options);
    
    if (!options.chargeTypes.includes('RECURRENT')) {
      throw new Error('Checkout deve incluir chargeType RECURRENT');
    }
    
    if (!options.subscription) {
      throw new Error('Subscription é obrigatória para checkout recorrente');
    }

    const payload = {
      ...options,
      items: options.items.map(item => ({
        ...item,
        value: formatAsaasAmount(item.value),
        quantity: item.quantity || 1
      })),
      subscription: options.subscription ? {
        ...options.subscription,
        value: formatAsaasAmount(options.subscription.value)
      } : undefined
    };

    return this.request<AsaasCheckoutResponse>('/checkout', 'POST', payload);
  }

  async createSubscription(options: AsaasSubscriptionRequest): Promise<AsaasSubscriptionResponse> {
    console.log('[AsaasClient] Creating subscription:', options);
    
    const payload = {
      ...options,
      value: formatAsaasAmount(options.value)
    };

    return this.request<AsaasSubscriptionResponse>('/subscriptions', 'POST', payload);
  }

  async getSubscription(subscriptionId: string): Promise<AsaasSubscriptionResponse> {
    console.log('[AsaasClient] Getting subscription:', subscriptionId);
    return this.request<AsaasSubscriptionResponse>(`/subscriptions/${subscriptionId}`, 'GET');
  }

  async listSubscriptionsByCustomer(customerId: string): Promise<{ data: AsaasSubscriptionResponse[] }> {
    console.log('[AsaasClient] Listing subscriptions for customer:', customerId);
    return this.request<{ data: AsaasSubscriptionResponse[] }>(
      `/subscriptions?customer=${customerId}`, 
      'GET'
    );
  }

  async cancelSubscription(subscriptionId: string): Promise<{ deleted: boolean; id: string }> {
    console.log('[AsaasClient] Canceling subscription:', subscriptionId);
    return this.request<{ deleted: boolean; id: string }>(
      `/subscriptions/${subscriptionId}`, 
      'DELETE'
    );
  }

  async createCustomer(options: {
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
    mobilePhone?: string;
    address?: string;
    addressNumber?: string;
    complement?: string;
    province?: string;
    postalCode?: string;
    externalReference?: string;
  }): Promise<{ id: string; name: string; email: string }> {
    console.log('[AsaasClient] Creating customer:', options.email);
    return this.request('/customers', 'POST', options);
  }

  async getCustomerByEmail(email: string): Promise<{ id: string; name: string; email: string } | null> {
    console.log('[AsaasClient] Getting customer by email:', email);
    const response = await this.request<{ data: any[] }>(
      `/customers?email=${encodeURIComponent(email)}`, 
      'GET'
    );
    return response.data.length > 0 ? response.data[0] : null;
  }
}

export function createAsaasClient(apiKey: string, environment: AsaasEnvironment): AsaasClient {
  return new AsaasClient(apiKey, environment);
}
