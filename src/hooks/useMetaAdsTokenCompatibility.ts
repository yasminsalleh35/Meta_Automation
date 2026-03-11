/**
 * ✅ FASE 1.2: Manual token validation only (no automatic validation)
 * ✅ FASE 3.1: Uses singleton MetaTokenValidator for global deduplication
 * ✅ FASE 4.2: Includes 10-minute validation cache via singleton
 */

import { useState, useRef, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { metaTokenValidator } from '@/lib/metaTokenValidator';
import { useGlobalMetaConfig } from '@/hooks/useGlobalMetaConfig';

interface CompatibilityStatus {
  isChecking: boolean;
  isCompatible: boolean | null;
  needsReconnection: boolean;
  error?: string;
  tokenAppId?: string;
  configuredAppId?: string;
}

export const useMetaAdsTokenCompatibility = (
  accessToken?: string,
  enabled: boolean = false // ✅ FASE 1.2: Default to false (manual only)
) => {
  const { toast } = useToast();
  const { config: globalConfig } = useGlobalMetaConfig();
  const [status, setStatus] = useState<CompatibilityStatus>({
    isChecking: false,
    isCompatible: null,
    needsReconnection: false
  });

  const mountedRef = useRef(true);

  // ✅ FASE 1.2: Manual validation only using singleton
  const validateCompatibility = useCallback(async () => {
    if (!accessToken) {
      console.log('🔍 Token compatibility check skipped: no token');
      return;
    }

    setStatus(prev => ({
      ...prev,
      isChecking: true
    }));

    console.log('🔍 Starting manual token validation via singleton...');

    try {
      if (!globalConfig?.appId) {
        throw new Error('Meta Ads configuration not found');
      }

      // ✅ FASE 3.1 + 4.2: Use singleton validator (global deduplication + 10min cache)
      const result = await metaTokenValidator.validate(accessToken, globalConfig);

      if (!mountedRef.current) return;

      console.log('✅ Token validation complete:', result);

      // Show reconnection warning if needed
      if (result.needsReconnection) {
        toast({
          title: "Reconexão necessária",
          description: "Seu token do Meta Ads precisa ser renovado. Clique em 'Reconectar agora'.",
          variant: "destructive",
          duration: 10000
        });
      }

      setStatus({
        isChecking: false,
        isCompatible: result.isCompatible,
        needsReconnection: result.needsReconnection,
        error: result.error,
        tokenAppId: globalConfig.appId,
        configuredAppId: globalConfig.appId
      });

    } catch (error: any) {
      if (!mountedRef.current) return;
      
      console.error('❌ Error during compatibility check:', error);
      
      const isRateLimit = error.message?.includes('rate limit') || 
                         error.message?.includes('Application request limit');
      
      setStatus({
        isChecking: false,
        isCompatible: false,
        needsReconnection: isRateLimit,
        error: error.message || 'Validation failed'
      });

      if (isRateLimit) {
        toast({
          title: "⚠️ Limite da API Meta atingido",
          description: "Aguarde alguns minutos antes de validar novamente.",
          variant: "destructive",
          duration: 8000
        });
      } else {
        toast({
          title: "Erro na validação do token",
          description: "Não foi possível validar o token. Tente novamente mais tarde.",
          variant: "destructive"
        });
      }
    }
  }, [accessToken, globalConfig?.appId, toast]);

  // ✅ FASE 1.2: NO automatic validation effect - manual only
  // Validation is triggered manually via button in MetaAdsConnectedStep

  return {
    ...status,
    validateCompatibility,
    refresh: validateCompatibility
  };
};
