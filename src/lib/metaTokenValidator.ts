/**
 * ✅ FASE 3.1: MetaTokenValidator Singleton
 * Ensures only ONE token validation request is active globally
 * ✅ FASE 4.2: Includes 10-minute validation cache
 */

import { supabase } from '@/integrations/supabase/client';

interface ValidationResult {
  isValid: boolean;
  isChecking: boolean;
  isCompatible: boolean;
  needsReconnection: boolean;
  error?: string;
}

interface CachedValidation {
  result: ValidationResult;
  timestamp: number;
}

class MetaTokenValidator {
  private static instance: MetaTokenValidator;
  private validationInProgress = false;
  private validationQueue: Array<{
    resolve: (value: ValidationResult) => void;
    reject: (error: any) => void;
  }> = [];
  
  // ✅ FASE 4.2: Cache with 10-minute TTL
  private cache = new Map<string, CachedValidation>();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

  static getInstance(): MetaTokenValidator {
    if (!this.instance) {
      this.instance = new MetaTokenValidator();
    }
    return this.instance;
  }

  async validate(accessToken: string, globalConfig: any): Promise<ValidationResult> {
    const cacheKey = `${accessToken?.slice(0, 10)}_${globalConfig?.appId}`;
    
    // ✅ FASE 4.2: Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log('[MetaTokenValidator] ✅ Using cached validation (valid for', 
        Math.round((this.CACHE_DURATION - (Date.now() - cached.timestamp)) / 1000), 'more seconds)');
      return cached.result;
    }

    // ✅ FASE 3.1: If validation in progress, queue this request
    if (this.validationInProgress) {
      console.log('[MetaTokenValidator] ⏳ Validation in progress, queuing request...');
      return new Promise((resolve, reject) => {
        this.validationQueue.push({ resolve, reject });
      });
    }

    this.validationInProgress = true;
    console.log('[MetaTokenValidator] 🔍 Starting new validation request');

    try {
      const result = await this.doValidation(accessToken, globalConfig);
      
      // ✅ FASE 4.2: Cache the result
      this.cache.set(cacheKey, { result, timestamp: Date.now() });
      console.log('[MetaTokenValidator] ✅ Validation cached for 10 minutes');
      
      // ✅ FASE 3.1: Resolve all queued requests
      if (this.validationQueue.length > 0) {
        console.log(`[MetaTokenValidator] ✅ Resolving ${this.validationQueue.length} queued requests`);
        this.validationQueue.forEach(cb => cb.resolve(result));
        this.validationQueue = [];
      }
      
      return result;
    } catch (error) {
      console.error('[MetaTokenValidator] ❌ Validation error:', error);
      
      // Reject all queued requests
      this.validationQueue.forEach(cb => cb.reject(error));
      this.validationQueue = [];
      
      throw error;
    } finally {
      this.validationInProgress = false;
    }
  }

  private async doValidation(accessToken: string, globalConfig: any): Promise<ValidationResult> {
    if (!accessToken || !globalConfig?.appId) {
      return {
        isValid: false,
        isChecking: false,
        isCompatible: false,
        needsReconnection: false,
        error: 'Missing access token or app configuration'
      };
    }

    try {
      const { data, error } = await supabase.functions.invoke('meta-validation', {
        body: {
          accessToken,
          appId: globalConfig.appId,
          appSecret: globalConfig.appSecret
        }
      });

      if (error) {
        console.error('[MetaTokenValidator] ❌ Edge function error:', error);
        
        // Check for rate limit
        const isRateLimit = error.message?.includes('rate limit') || 
                           error.message?.includes('Application request limit');
        
        return {
          isValid: false,
          isChecking: false,
          isCompatible: false,
          needsReconnection: isRateLimit,
          error: error.message || 'Validation failed'
        };
      }

      const isValid = data?.isValid === true;
      const needsReconnection = data?.needsReconnection === true || data?.isValid === false;

      return {
        isValid,
        isChecking: false,
        isCompatible: isValid && !needsReconnection,
        needsReconnection,
        error: data?.error
      };
    } catch (error: any) {
      console.error('[MetaTokenValidator] ❌ Unexpected error:', error);
      return {
        isValid: false,
        isChecking: false,
        isCompatible: false,
        needsReconnection: false,
        error: error.message || 'Validation failed'
      };
    }
  }

  // Clear cache (useful for testing or forced revalidation)
  clearCache(): void {
    this.cache.clear();
    console.log('[MetaTokenValidator] 🗑️ Cache cleared');
  }
}

export const metaTokenValidator = MetaTokenValidator.getInstance();
