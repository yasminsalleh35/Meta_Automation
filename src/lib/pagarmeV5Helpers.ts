// =============================================
// Pagar.me V5 Helpers
// Funções auxiliares para extração de token e normalização de telefone
// =============================================

/**
 * Remove tudo que não é dígito de uma string
 */
export function stripDigits(s: string): string {
  return (s || '').replace(/\D/g, '');
}

/**
 * Extrai o token V5 do payload retornado pelo SDK
 * Aceita múltiplos formatos para compatibilidade
 */
export function extractV5Token(tokenPayload: any): string | null {
  const t =
    tokenPayload?.token ??
    tokenPayload?.id ??
    tokenPayload?.['pagarmetoken-0'] ??
    tokenPayload?.['payment_token'];
  return typeof t === 'string' ? t : null;
}

/**
 * Valida se o token tem formato V5 válido (token_XXXXXXXXXX)
 */
export function isValidV5Token(token: string | null): boolean {
  return !!token && /^token_[A-Za-z0-9]{10,}$/.test(token);
}

/**
 * Normaliza telefone brasileiro para o formato V5
 * Aceita: "(33) 99111-9183" ou "33991119183"
 * Retorna: { country_code: '55', area_code: '33', number: '991119183' }
 */
export function parseBrPhone(input: string): {
  country_code: string;
  area_code: string;
  number: string;
} | null {
  // Remove tudo que não é dígito
  const digits = (input || '').replace(/\D/g, '');
  
  // Validar comprimento mínimo (10 = DDD + 8 dígitos, 11 = DDD + 9 dígitos)
  if (digits.length < 10 || digits.length > 11) {
    console.warn('[parseBrPhone] Telefone com comprimento inválido:', digits.length);
    return null;
  }
  
  // Extrai os últimos 8 ou 9 dígitos como número
  const number = digits.length === 11 ? digits.slice(-9) : digits.slice(-8);
  
  // Extrai DDD (2 dígitos antes do número)
  const area = digits.length === 11 ? digits.slice(0, 2) : digits.slice(0, 2);
  
  return {
    country_code: '55',
    area_code: area,
    number: number
  };
}

/**
 * Formata telefone para exibição (XX) XXXXX-XXXX
 */
export function formatPhoneDisplay(input: string): string {
  const digits = (input || '').replace(/\D/g, '');
  return digits
    .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    .slice(0, 15);
}

/**
 * Formata número de cartão com espaços
 */
export function formatCardNumber(input: string): string {
  const digits = (input || '').replace(/\D/g, '');
  return digits
    .replace(/(\d{4})(?=\d)/g, '$1 ')
    .slice(0, 19);
}

/**
 * Construir e validar payload para edge function pagarme-subscribe
 * Retorna { ok: true, body } ou { ok: false, errors }
 */
export function buildSubscribeBody(params: {
  env: 'test' | 'live';
  planId: string;
  installments: number;
  name: string;
  email: string;
  phone: string;
  document: string;
  address: {
    zipCode: string;
    street: string;
    number: string;
    city: string;
    state: string;
  };
  sdkTokenPayload: any;
}):
  | { ok: true; body: { 
      env: string; 
      plan_id: string; 
      installments: number; 
      buyer: { 
        name: string; 
        email: string; 
        phone: { country_code: string; area_code: string; number: string }; 
        document: string;
        address: {
          line_1: string;
          number: string;
          zip_code: string;
          city: string;
          state: string;
          country: string;
        };
      }; 
      card_token: string;
    } }
  | { ok: false; errors: string[] }
{
  const errors: string[] = [];
  
  // 1. Extrair token
  const token = extractV5Token(params.sdkTokenPayload);
  if (!token) {
    errors.push('card_token ausente');
  }
  
  // 2. Validar plan_id
  if (!params.planId) {
    errors.push('plan_id ausente');
  }
  
  // 3. Validar nome (mínimo: nome e sobrenome)
  const nm = (params.name || '').trim();
  if (!nm || nm.split(/\s+/).length < 2) {
    errors.push('buyer.name (informe nome e sobrenome)');
  }
  
  // 4. Validar email
  const em = (params.email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)) {
    errors.push('buyer.email inválido');
  }
  
  // 5. Validar telefone
  const parsed = parseBrPhone(params.phone);
  if (!parsed || !parsed.area_code || !parsed.number) {
    errors.push(`buyer.phone inválido (formato: DDD + número)`);
  }
  
  // 6. Validar CPF
  const cpf = stripDigits(params.document);
  console.log('[buildSubscribeBody] CPF validation:', {
    input: params.document,
    stripped: cpf,
    length: cpf.length
  });
  
  if (cpf.length !== 11) {
    errors.push('buyer.document (CPF deve ter 11 dígitos)');
  }
  
  // 7. Validar endereço
  const zipCode = stripDigits(params.address.zipCode);
  if (zipCode.length !== 8) {
    errors.push('buyer.address.zip_code (CEP deve ter 8 dígitos)');
  }
  
  if (!params.address.street || params.address.street.trim().length < 3) {
    errors.push('buyer.address.line_1 (rua/endereço inválido)');
  }
  
  if (!params.address.number || params.address.number.trim().length < 1) {
    errors.push('buyer.address.number (número obrigatório)');
  }
  
  if (!params.address.city || params.address.city.trim().length < 2) {
    errors.push('buyer.address.city (cidade inválida)');
  }
  
  if (!params.address.state || params.address.state.length !== 2) {
    errors.push('buyer.address.state (UF deve ter 2 letras)');
  }
  
  if (errors.length) {
    return { ok: false, errors };
  }
  
  return {
    ok: true,
    body: {
      env: params.env,
      plan_id: params.planId,
      installments: params.installments,
      buyer: {
        name: nm,
        email: em,
        phone: {
          country_code: parsed!.country_code,
          area_code: parsed!.area_code,
          number: parsed!.number
        },
        document: cpf,
        address: {
          line_1: params.address.street.trim(),
          number: params.address.number.trim(),
          zip_code: zipCode,
          city: params.address.city.trim(),
          state: params.address.state.toUpperCase(),
          country: 'BR'
        }
      },
      card_token: token!
    }
  };
}
