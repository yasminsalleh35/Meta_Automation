/**
 * Monitor e log de rate limits da Meta API
 * 
 * Seguindo recomendações oficiais Meta:
 * https://developers.facebook.com/docs/graph-api/overview/rate-limiting
 */

export interface MetaRateLimitHeaders {
  'X-App-Usage'?: string;
  'X-Business-Use-Case-Usage'?: string;
  'X-FB-Ads-Insights-Throttle'?: string;
}

export interface UsageMetrics {
  call_count?: number;
  total_cputime?: number;
  total_time?: number;
}

export function logMetaRateLimitHeaders(response: Response): MetaRateLimitHeaders {
  const headers: MetaRateLimitHeaders = {
    'X-App-Usage': response.headers.get('X-App-Usage') || undefined,
    'X-Business-Use-Case-Usage': response.headers.get('X-Business-Use-Case-Usage') || undefined,
    'X-FB-Ads-Insights-Throttle': response.headers.get('X-FB-Ads-Insights-Throttle') || undefined
  };

  // Log X-App-Usage (nível de app)
  if (headers['X-App-Usage']) {
    try {
      const usage: UsageMetrics = JSON.parse(headers['X-App-Usage']);
      console.log('📊 Meta API App Usage:', {
        calls: `${usage.call_count}%`,
        cpu: `${usage.total_cputime}%`,
        time: `${usage.total_time}%`
      });

      // Alerta se próximo do limite (80%)
      if (usage.call_count && usage.call_count > 80) {
        console.warn('🚨 ALERTA: Uso de API Meta acima de 80%!', {
          current: `${usage.call_count}%`,
          recommendation: 'Considere implementar backoff ou cache'
        });
      }

      // Alerta crítico (95%)
      if (usage.call_count && usage.call_count > 95) {
        console.error('🔴 CRÍTICO: Uso de API Meta acima de 95%!', {
          current: `${usage.call_count}%`,
          action: 'Pausar novas chamadas imediatamente'
        });
      }
    } catch (e) {
      console.error('Error parsing X-App-Usage:', e);
    }
  }

  // Log X-Business-Use-Case-Usage (Marketing API/Ads)
  if (headers['X-Business-Use-Case-Usage']) {
    try {
      const bucUsage = JSON.parse(headers['X-Business-Use-Case-Usage']);
      console.log('📊 Meta Business Use Case Usage:', bucUsage);
      
      // Verificar por business use case
      for (const [bucId, data] of Object.entries(bucUsage)) {
        const metrics = data as any;
        if (metrics.call_count > 80) {
          console.warn(`🚨 Business Use Case ${bucId} acima de 80%:`, metrics);
        }
      }
    } catch (e) {
      console.error('Error parsing X-Business-Use-Case-Usage:', e);
    }
  }

  // Log X-FB-Ads-Insights-Throttle (Insights específico)
  if (headers['X-FB-Ads-Insights-Throttle']) {
    try {
      const throttle = JSON.parse(headers['X-FB-Ads-Insights-Throttle']);
      console.log('📊 Meta Ads Insights Throttle:', throttle);
      
      if (throttle.app_id_util_pct > 80) {
        console.warn('🚨 Insights throttle acima de 80%:', throttle);
      }
    } catch (e) {
      console.error('Error parsing X-FB-Ads-Insights-Throttle:', e);
    }
  }

  return headers;
}

/**
 * Calcula tempo de backoff exponencial com jitter
 * 
 * @param retryCount Número de tentativas (0-indexed)
 * @param baseDelay Delay base em ms (padrão: 1000ms)
 * @param maxDelay Delay máximo em ms (padrão: 32000ms)
 */
export function calculateBackoffDelay(
  retryCount: number,
  baseDelay: number = 1000,
  maxDelay: number = 32000
): number {
  // Backoff exponencial: 1s, 2s, 4s, 8s, 16s, 32s
  const exponentialDelay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  
  // Jitter (randomização de ±25%)
  const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
  
  return Math.floor(exponentialDelay + jitter);
}

/**
 * Verifica se deve fazer retry baseado no erro e headers
 */
export function shouldRetry(
  error: any,
  retryCount: number,
  maxRetries: number = 3
): boolean {
  if (retryCount >= maxRetries) return false;

  // Rate limit error (4 ou 17 no Meta API)
  const errorCode = error?.code || error?.error?.code;
  if (errorCode === 4 || errorCode === 17) {
    console.log(`🔄 Rate limit hit, will retry (attempt ${retryCount + 1}/${maxRetries})`);
    return true;
  }

  // Transient errors (5xx, network issues)
  if (error?.status >= 500 || error?.message?.includes('network')) {
    console.log(`🔄 Transient error, will retry (attempt ${retryCount + 1}/${maxRetries})`);
    return true;
  }

  return false;
}