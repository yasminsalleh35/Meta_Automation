import { useQuery, UseQueryOptions } from '@tanstack/react-query';
import { useRef } from 'react';

// Global tracker para controlar chamadas por endpoint
const globalCallTracker = new Map<string, { count: number; resetTime: number }>();
const CALLS_PER_MINUTE = 10;
const WINDOW_MS = 60000; // 1 minuto

/**
 * Hook wrapper para useQuery com rate limiting integrado
 * Previne excesso de chamadas à API do Meta
 * 
 * @param queryKey - Chave única da query
 * @param queryFn - Função que faz a chamada à API
 * @param options - Opções do useQuery
 * @param maxCallsPerMinute - Limite de chamadas por minuto (padrão: 10)
 */
export const useRateLimitedQuery = <TData = unknown, TError = unknown>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, TError>, 'queryKey' | 'queryFn'>,
  maxCallsPerMinute: number = CALLS_PER_MINUTE
) => {
  const lastCallRef = useRef(0);
  const endpoint = queryKey[0];

  const rateLimitedQueryFn = async (): Promise<TData> => {
    const now = Date.now();
    
    // Obter ou criar tracker para este endpoint
    let tracker = globalCallTracker.get(endpoint);
    
    if (!tracker || now > tracker.resetTime) {
      // Criar novo tracker ou resetar após janela de tempo
      tracker = { count: 0, resetTime: now + WINDOW_MS };
      globalCallTracker.set(endpoint, tracker);
    }

    // Verificar se excedeu o limite
    if (tracker.count >= maxCallsPerMinute) {
      const waitTime = Math.ceil((tracker.resetTime - now) / 1000);
      console.warn(
        `[RATE LIMIT] ${endpoint}: ${tracker.count}/${maxCallsPerMinute} chamadas. ` +
        `Aguarde ${waitTime}s`
      );
      
      // Lançar erro que será tratado pelo retry do React Query
      throw new Error(`Rate limit: aguarde ${waitTime}s`);
    }

    // Incrementar contador
    tracker.count++;
    lastCallRef.current = now;

    console.log(
      `[API CALL] ${endpoint}: ${tracker.count}/${maxCallsPerMinute} chamadas neste minuto`
    );

    // Executar chamada original
    return queryFn();
  };

  return useQuery<TData, TError>({
    queryKey,
    queryFn: rateLimitedQueryFn,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
    ...options
  });
};
