
export class MetaAdsPreviewService {
  private baseUrl = 'https://graph.facebook.com/v23.0';

  // All supported ad formats in v23.0
  private readonly AD_FORMATS = {
    DESKTOP_FEED_STANDARD: 'Desktop Feed',
    MOBILE_FEED_STANDARD: 'Mobile Feed',
    MOBILE_BANNER: 'Mobile Banner',
    MOBILE_INTERSTITIAL: 'Mobile Interstitial',
    INSTAGRAM_STANDARD: 'Instagram Feed',
    INSTAGRAM_STORY_MOBILE: 'Instagram Stories',
    MESSENGER_MOBILE: 'Messenger',
    AUDIENCE_NETWORK_MOBILE_BANNER: 'Audience Network Banner'
  };

  // Check if ad exists and is in valid state before generating preview
  async checkAdStatus(adId: string, accessToken: string): Promise<{
    isValid: boolean;
    status?: string;
    effectiveStatus?: string;
  }> {
    try {
      console.log(`🔍 Checking ad status for ${adId}...`);
      
      const response = await fetch(
        `${this.baseUrl}/${adId}?fields=id,status,effective_status,configured_status&access_token=${accessToken}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        console.warn('⚠️ Ad status check failed:', response.status);
        return { isValid: false };
      }

      const data = await response.json();
      console.log('📊 Ad status check result:', data);
      
      // Check if ad exists and has valid status for preview
      const validStatuses = ['ACTIVE', 'PAUSED', 'PENDING_REVIEW', 'APPROVED'];
      const isValid = data.id && validStatuses.includes(data.status);
      
      return {
        isValid,
        status: data.status,
        effectiveStatus: data.effective_status
      };
    } catch (error) {
      console.warn('⚠️ Error checking ad status:', error);
      return { isValid: false };
    }
  }

  // Generate ad preview with enhanced parameters
  async generateAdPreview(
    adId: string, 
    accessToken: string,
    format: keyof typeof this.AD_FORMATS = 'DESKTOP_FEED_STANDARD',
    options: {
      locale?: string;
      creativeFeatureSpec?: any;
      productItemIds?: string[];
      retryCount?: number;
    } = {}
  ): Promise<any> {
    const { locale = 'pt_BR', creativeFeatureSpec, productItemIds, retryCount = 0 } = options;
    
    try {
      console.log(`🎬 Generating preview for ad ${adId} with format ${format}...`);
      
      // Build query parameters
      const params = new URLSearchParams({
        ad_format: format,
        access_token: accessToken,
        locale
      });

      // Add optional parameters
      if (creativeFeatureSpec) {
        params.append('creative_feature_spec', JSON.stringify(creativeFeatureSpec));
      }
      
      if (productItemIds && productItemIds.length > 0) {
        params.append('product_item_ids', JSON.stringify(productItemIds));
      }

      const response = await fetch(
        `${this.baseUrl}/${adId}/previews?${params.toString()}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ Preview generation failed for ${format}:`, errorData);
        
        // Enhanced retry logic based on error type
        if (retryCount < 3) {
          const shouldRetry = this.shouldRetryError(errorData, response.status);
          
          if (shouldRetry) {
            console.log(`🔄 Retrying preview generation for ${format} (attempt ${retryCount + 1})...`);
            const delay = Math.min(2000 * Math.pow(2, retryCount), 10000); // Exponential backoff
            await new Promise(resolve => setTimeout(resolve, delay));
            
            return this.generateAdPreview(adId, accessToken, format, {
              ...options,
              retryCount: retryCount + 1
            });
          }
        }
        
        throw new Error(this.parseErrorMessage(errorData, format));
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        throw new Error(`Nenhum preview disponível para formato ${this.AD_FORMATS[format]}`);
      }

      console.log(`✅ Preview generated successfully for ${format}`);
      return {
        ...data.data[0],
        format,
        formatName: this.AD_FORMATS[format]
      };
    } catch (error) {
      console.error(`❌ Error generating ad preview for ${format}:`, error);
      throw error;
    }
  }

  // Determine if error should trigger a retry
  private shouldRetryError(errorData: any, statusCode: number): boolean {
    const retryableErrors = [
      'temporarily unavailable',
      'rate limit',
      'internal error',
      'service unavailable'
    ];
    
    const errorMessage = errorData?.error?.message?.toLowerCase() || '';
    const isRetryableStatus = [429, 500, 502, 503, 504].includes(statusCode);
    const isRetryableMessage = retryableErrors.some(error => errorMessage.includes(error));
    
    return isRetryableStatus || isRetryableMessage;
  }

  // Parse error message for user-friendly display
  private parseErrorMessage(errorData: any, format: string): string {
    const errorMessage = errorData?.error?.message || '';
    const formatName = this.AD_FORMATS[format as keyof typeof this.AD_FORMATS];
    
    if (errorMessage.includes('does not exist')) {
      return `Anúncio não encontrado ou sem permissão para acessar`;
    }
    
    if (errorMessage.includes('missing permissions')) {
      return `Permissões insuficientes para gerar preview do ${formatName}`;
    }
    
    if (errorMessage.includes('not supported')) {
      return `Formato ${formatName} não suportado para este tipo de anúncio`;
    }
    
    if (errorMessage.includes('rate limit')) {
      return `Limite de requisições atingido. Tente novamente em alguns minutos`;
    }
    
    return errorMessage || `Falha ao gerar preview para formato ${formatName}`;
  }

  // Get multiple preview formats with smart format selection
  async getMultipleFormats(
    adId: string, 
    accessToken: string,
    options: {
      locale?: string;
      includeStories?: boolean;
      includeMessenger?: boolean;
      includeAudienceNetwork?: boolean;
    } = {}
  ): Promise<any[]> {
    const { 
      locale = 'pt_BR',
      includeStories = true,
      includeMessenger = false,
      includeAudienceNetwork = false 
    } = options;

    // Base formats that work for most ad types
    const baseFormats: (keyof typeof this.AD_FORMATS)[] = [
      'DESKTOP_FEED_STANDARD',
      'MOBILE_FEED_STANDARD',
      'INSTAGRAM_STANDARD'
    ];

    // Additional formats based on options
    const additionalFormats: (keyof typeof this.AD_FORMATS)[] = [];
    
    if (includeStories) {
      additionalFormats.push('INSTAGRAM_STORY_MOBILE');
    }
    
    if (includeMessenger) {
      additionalFormats.push('MESSENGER_MOBILE');
    }
    
    if (includeAudienceNetwork) {
      additionalFormats.push('AUDIENCE_NETWORK_MOBILE_BANNER');
    }

    const allFormats = [...baseFormats, ...additionalFormats];

    console.log(`🎬 Generating previews for ad ${adId} in ${allFormats.length} formats...`);

    // Check if ad is ready for preview
    const statusCheck = await this.checkAdStatus(adId, accessToken);
    if (!statusCheck.isValid) {
      console.warn('⚠️ Ad not ready for preview generation:', statusCheck);
      return [];
    }

    // Add delay for newly created ads
    console.log('⏳ Waiting for ad to be fully processed...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Generate previews concurrently with proper error handling
    const previewPromises = allFormats.map(async (format) => {
      try {
        const preview = await this.generateAdPreview(adId, accessToken, format, { locale });
        return preview;
      } catch (error) {
        console.warn(`⚠️ Preview failed for ${format}:`, error instanceof Error ? error.message : error);
        return null;
      }
    });

    const results = await Promise.allSettled(previewPromises);
    
    const successfulPreviews = results
      .map(result => result.status === 'fulfilled' ? result.value : null)
      .filter(preview => preview !== null);

    console.log(`✅ Generated ${successfulPreviews.length} of ${allFormats.length} previews`);
    
    // If no previews were generated, try just the basic format
    if (successfulPreviews.length === 0) {
      console.log('🔄 Attempting fallback to basic format...');
      try {
        const fallbackPreview = await this.generateAdPreview(
          adId, 
          accessToken, 
          'DESKTOP_FEED_STANDARD',
          { locale }
        );
        return [fallbackPreview];
      } catch (error) {
        console.error('❌ Fallback preview also failed:', error);
        return [];
      }
    }

    return successfulPreviews;
  }

  // Get available formats for an ad type
  getAvailableFormats(): { key: keyof typeof this.AD_FORMATS; name: string }[] {
    return Object.entries(this.AD_FORMATS).map(([key, name]) => ({
      key: key as keyof typeof this.AD_FORMATS,
      name
    }));
  }

  // Cache management for previews
  private previewCache = new Map<string, { data: any; timestamp: number }>();
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private getCacheKey(adId: string, format: string): string {
    return `${adId}_${format}`;
  }

  private getCachedPreview(adId: string, format: string): any | null {
    const key = this.getCacheKey(adId, format);
    const cached = this.previewCache.get(key);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      console.log(`📦 Using cached preview for ${format}`);
      return cached.data;
    }
    
    if (cached) {
      this.previewCache.delete(key);
    }
    
    return null;
  }

  private setCachedPreview(adId: string, format: string, data: any): void {
    const key = this.getCacheKey(adId, format);
    this.previewCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Clear cache for specific ad
  clearAdCache(adId: string): void {
    const keysToDelete = Array.from(this.previewCache.keys())
      .filter(key => key.startsWith(`${adId}_`));
    
    keysToDelete.forEach(key => this.previewCache.delete(key));
    console.log(`🗑️ Cleared cache for ad ${adId}`);
  }
}

export const metaAdsPreviewService = new MetaAdsPreviewService();
