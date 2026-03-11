import { useMemo } from 'react';

/**
 * Hook para detecção robusta de estado de recovery
 * Verifica múltiplas fontes para garantir detecção confiável
 */
export const useRecoveryState = () => {
  return useMemo(() => {
    if (typeof window === 'undefined') return { isRecovery: false, hasExpiredError: false };
    
    const urlParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    
    // Verificar se é fluxo de recovery
    const isRecovery = urlParams.get('type') === 'recovery' || hashParams.get('type') === 'recovery';
    
    // Verificar se há erro de expiração
    const hasExpiredError = 
      urlParams.get('error') === 'access_denied' || 
      urlParams.get('error_code') === 'otp_expired' ||
      hashParams.get('error') === 'access_denied' || 
      hashParams.get('error_code') === 'otp_expired';
    
    // Verificar se tem token de acesso válido no hash (indicativo de recovery ativo)
    const hasAccessToken = hashParams.get('access_token') !== null;
    const hasRefreshToken = hashParams.get('refresh_token') !== null;
    const hasValidTokens = hasAccessToken && hasRefreshToken;
    
    return {
      isRecovery,
      hasExpiredError,
      hasValidTokens,
      isActiveRecovery: isRecovery && !hasExpiredError && hasValidTokens
    };
  }, []);
};