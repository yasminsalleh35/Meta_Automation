// DEPRECATED: This service is no longer used
// Token validation is now handled by the meta-validation Edge Function
// to avoid CSP (Content Security Policy) issues with direct calls to graph.facebook.com

interface TokenCompatibilityResult {
  isCompatible: boolean;
  currentAppId?: string;
  configuredAppId?: string;
  tokenAppId?: string;
  error?: string;
}

export class MetaAdsTokenValidationService {
  /**
   * @deprecated Use the meta-validation Edge Function instead
   * This method is kept for backward compatibility but should not be used
   */
  async validateTokenCompatibility(
    accessToken: string,
    configuredAppId: string,
    configuredAppSecret: string
  ): Promise<TokenCompatibilityResult> {
    console.warn('⚠️ MetaAdsTokenValidationService.validateTokenCompatibility is deprecated. Use meta-validation Edge Function instead.');
    
    return {
      isCompatible: false,
      configuredAppId,
      error: 'Direct token validation is disabled due to CSP restrictions. Use Edge Function instead.'
    };
  }

  /**
   * @deprecated Use the meta-validation Edge Function instead
   */
  async isTokenExpiringSoon(accessToken: string, appAccessToken: string): Promise<boolean> {
    console.warn('⚠️ MetaAdsTokenValidationService.isTokenExpiringSoon is deprecated. Use meta-validation Edge Function instead.');
    return false;
  }

  /**
   * @deprecated Direct calls to Meta API are disabled due to CSP
   */
  async debugToken(accessToken: string, appAccessToken: string): Promise<any> {
    console.warn('⚠️ MetaAdsTokenValidationService.debugToken is deprecated due to CSP restrictions.');
    throw new Error('Direct Meta API calls are disabled. Use Edge Functions instead.');
  }
}

export const metaAdsTokenValidationService = new MetaAdsTokenValidationService();