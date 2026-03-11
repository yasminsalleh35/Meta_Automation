// DEPRECATED: This service has been replaced by Edge Functions
// All Meta API calls now go through Supabase Edge Functions to avoid CSP issues

import { supabase } from '@/integrations/supabase/client';

interface ProcessedMetaAsset {
  pageId: string;
  pageName: string;
  pageAccessToken?: string;
  instagramId?: string;
  instagramName?: string;
}

export class MetaAssetsProcessor {
  
  /**
   * @deprecated Use the meta-assets Edge Function instead
   * This method now delegates to Edge Functions to avoid CSP violations
   */
  static async processMetaAssetsAfterOAuth(
    accessToken: string, 
    userId: string
  ): Promise<ProcessedMetaAsset[]> {
    console.warn('⚠️ MetaAssetsProcessor.processMetaAssetsAfterOAuth is deprecated. Use meta-assets Edge Function instead.');
    
    try {
      console.log('🔄 Delegating to meta-assets Edge Function...');
      
      // Use Edge Function instead of direct API calls
      const { data: assetsResult, error } = await supabase.functions.invoke('meta-assets', {
        body: { 
          fetchAccounts: false,
          fetchPages: true,
          fetchInstagram: true
        }
      });

      if (error) {
        console.error('❌ Edge Function error:', error);
        throw new Error(error.message || 'Failed to fetch Meta assets');
      }

      // Process the response to match expected format
      const processedAssets: ProcessedMetaAsset[] = [];
      
      if (assetsResult?.pages && Array.isArray(assetsResult.pages)) {
        assetsResult.pages.forEach((page: any) => {
          const asset: ProcessedMetaAsset = {
            pageId: page.id,
            pageName: page.name,
            pageAccessToken: page.access_token
          };
          
          // Check if this page has Instagram data
          const instagramAccount = assetsResult.instagram?.find(
            (ig: any) => ig.pageId === page.id
          );
          
          if (instagramAccount) {
            asset.instagramId = instagramAccount.id;
            asset.instagramName = instagramAccount.name;
          }
          
          processedAssets.push(asset);
        });
      }
      
      console.log('✅ Successfully processed assets via Edge Function:', processedAssets.length);
      return processedAssets;
      
    } catch (error) {
      console.error('❌ MetaAssetsProcessor: Error processing assets via Edge Function:', error);
      throw error;
    }
  }
  
  /**
   * @deprecated This method is no longer needed as Edge Functions handle integration updates
   */
  private static async updateIntegrationWithAssets(
    userId: string,
    accessToken: string,
    processedAssets: ProcessedMetaAsset[],
    rawPagesData: any[]
  ): Promise<void> {
    console.warn('⚠️ MetaAssetsProcessor.updateIntegrationWithAssets is deprecated. Edge Functions handle this automatically.');
  }
  
  /**
   * Formats assets for UI display - still useful for UI components
   */
  static formatAssetsForUI(assets: ProcessedMetaAsset[]) {
    const facebookPages = assets.map(asset => ({
      id: asset.pageId,
      name: asset.pageName
    }));
    
    const instagramAccounts = assets
      .filter(asset => asset.instagramId)
      .map(asset => ({
        id: asset.instagramId!,
        name: asset.instagramName!,
        pageId: asset.pageId
      }));
    
    return {
      facebookPages,
      instagramAccounts,
      totalPages: facebookPages.length,
      totalInstagram: instagramAccounts.length
    };
  }
}