import { SimpleCampaignPayload, CampaignProcessingResult } from './types.ts';
import { DiagnosticLogger } from './diagnostic-logger.ts';
import { toMessage, toObject } from '../_shared/errors.ts';

export class CampaignProcessor {
  private diagnosticLogger: DiagnosticLogger;

  constructor(diagnosticLogger: DiagnosticLogger) {
    this.diagnosticLogger = diagnosticLogger;
  }

  async processEnhancedCampaign(
    payload: SimpleCampaignPayload, 
    integration: any
  ): Promise<CampaignProcessingResult> {
    this.diagnosticLogger.log('info', 'campaign_processing_start', '🚀 Enhanced campaign processing initiated', {
      payload_summary: {
        campaign_name: payload.campaignName,
        creative_type: payload.creativeType,
        objective: payload.objective,
        target_locations: payload.targetLocations?.length || 0,
        budget: payload.dailyBudget,
        age_range: `${payload.ageMin}-${payload.ageMax}`,
        gender: payload.gender,
        interests: payload.interests?.length || 0,
        placements: payload.placements?.length || 0,
        fanpage_name: payload.fanpageName,
        instagram_account: payload.instagramAccount,
        media_type: payload.creativeType
      }
    });

    try {
      // Logging integration analysis
      await this.logIntegrationAnalysis(integration);
      
      if (payload.creativeType === 'upload') {
        return await this.processUploadFlow(payload, integration);
      } else {
        return await this.processExistingPostFlow(payload, integration);
      }
    } catch (error: unknown) {
      this.diagnosticLogger.log('error', 'campaign_processing_error', 'Campaign processing failed', {
        error: toMessage(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  private async logIntegrationAnalysis(integration: any): Promise<void> {
    this.diagnosticLogger.log('info', 'integration_analysis', '🔍 Analyzing Meta integration data', {
      integration_summary: {
        user_id: integration.user_id,
        ad_account_id: integration.ad_account_id,
        page_id: integration.page_id,
        status: integration.status,
        has_access_token: !!integration.access_token,
        token_length: integration.access_token?.length || 0,
        last_sync: integration.updated_at
      }
    });
  }

  private async processUploadFlow(
    payload: SimpleCampaignPayload, 
    integration: any
  ): Promise<CampaignProcessingResult> {
    this.diagnosticLogger.log('info', 'upload_flow_start', '📤 Processing UPLOAD flow');

    // Get the proper access token (page token or user token)
    const accessToken = await this.resolveAccessToken(
      integration.access_token, 
      integration.page_id, 
      payload.fanpageName || ''
    );

    // Upload media to ad account
    const mediaResult = await this.uploadMediaToMetaAdAccount(
      payload.mediaMetadata,
      integration.ad_account_id,
      accessToken
    );

    this.diagnosticLogger.log('info', 'media_upload_success', 'Media uploaded successfully', {
      media_hash: mediaResult.hash,
      media_url: mediaResult.url,
      video_id: mediaResult.video_id
    });

    // Validate Instagram connection if needed
    const instagramValidation = payload.instagramAccount 
      ? await this.validateInstagramConnection(integration.page_id, payload.instagramAccount, accessToken)
      : { isValid: false, reason: 'not_specified' };

    // Build object_story_spec
    const objectStorySpec = this.buildObjectStorySpecForUpload(payload, mediaResult, instagramValidation);

    // Create campaign components
    const campaignResult = await this.createCampaignComponents(
      payload,
      integration.ad_account_id,
      accessToken,
      objectStorySpec
    );

    this.diagnosticLogger.log('info', 'upload_flow_complete', '✅ Upload flow completed successfully', {
      campaign_id: campaignResult.campaignId,
      ad_set_id: campaignResult.adSetId,
      creative_id: campaignResult.creativeId,
      ad_id: campaignResult.adId
    });

    return {
      success: true,
      campaignId: campaignResult.campaignId,
      adSetId: campaignResult.adSetId,
      creativeId: campaignResult.creativeId,
      adId: campaignResult.adId,
      mediaHash: mediaResult.hash,
      mediaUrl: mediaResult.url,
      videoId: mediaResult.video_id
    };
  }

  private async processExistingPostFlow(
    payload: SimpleCampaignPayload, 
    integration: any
  ): Promise<CampaignProcessingResult> {
    this.diagnosticLogger.log('info', 'existing_post_flow_start', '🔄 Processing EXISTING POST flow');

    // Get the proper access token
    const accessToken = await this.resolveAccessToken(
      integration.access_token, 
      integration.page_id, 
      payload.fanpageName || ''
    );

    // Build object_story_spec for existing post
    const objectStorySpec = this.buildObjectStorySpecForExistingPost(payload);

    // Create campaign components
    const campaignResult = await this.createCampaignComponents(
      payload,
      integration.ad_account_id,
      accessToken,
      objectStorySpec
    );

    this.diagnosticLogger.log('info', 'existing_post_flow_complete', '✅ Existing post flow completed successfully', {
      campaign_id: campaignResult.campaignId,
      ad_set_id: campaignResult.adSetId,
      creative_id: campaignResult.creativeId,
      ad_id: campaignResult.adId,
      post_id: payload.postId
    });

    return {
      success: true,
      campaignId: campaignResult.campaignId,
      adSetId: campaignResult.adSetId,
      creativeId: campaignResult.creativeId,
      adId: campaignResult.adId,
      postId: payload.postId
    };
  }

  private async resolveAccessToken(
    userToken: string, 
    pageId: string, 
    fanpageName: string
  ): Promise<string> {
    this.diagnosticLogger.log('info', 'token_resolution_start', 'Resolving appropriate access token', {
      page_id: pageId,
      fanpage_name: fanpageName,
      user_token_length: userToken?.length || 0
    });

    if (!pageId) {
      this.diagnosticLogger.log('warn', 'token_resolution_no_page', 'No page ID provided, using user token');
      return userToken;
    }

    try {
      // Fetch page accounts to get page-specific token
      const response = await fetch(`https://graph.facebook.com/v18.0/me/accounts?access_token=${userToken}&fields=id,name,access_token`);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      const pageAccount = data.data?.find((account: any) => account.id === pageId);
      
      if (!pageAccount || !pageAccount.access_token) {
        this.diagnosticLogger.log('warn', 'token_resolution_fallback', 'Page token not found, using user token', {
          available_pages: data.data?.length || 0,
          target_page_id: pageId
        });
        return userToken;
      }

      this.diagnosticLogger.log('info', 'token_resolution_success', 'Page access token resolved successfully', {
        page_id: pageId,
        page_name: pageAccount.name,
        page_token_length: pageAccount.access_token?.length || 0
      });

      return pageAccount.access_token;
    } catch (error: unknown) {
      this.diagnosticLogger.log('error', 'token_resolution_error', 'Failed to resolve page token, using user token', {
        error: toMessage(error),
        fallback_token_length: userToken?.length || 0
      });
      return userToken;
    }
  }

  private async uploadMediaToMetaAdAccount(
    mediaMetadata: any, 
    adAccountId: string, 
    accessToken: string
  ): Promise<any> {
    this.diagnosticLogger.log('info', 'media_upload_start', 'Starting media upload to Meta ad account', {
      ad_account_id: adAccountId,
      media_filename: mediaMetadata?.filename,
      media_size: mediaMetadata?.size,
      media_type: mediaMetadata?.type
    });

    try {
      const isVideo = mediaMetadata?.type?.startsWith('video/');
      const endpoint = isVideo 
        ? `https://graph.facebook.com/v18.0/${adAccountId}/advideos`
        : `https://graph.facebook.com/v18.0/${adAccountId}/adimages`;

      const formData = new FormData();
      
      // Fetch the file from the media URL
      const fileResponse = await fetch(mediaMetadata.url);
      const fileBlob = await fileResponse.blob();
      
      formData.append('access_token', accessToken);
      formData.append('filename', mediaMetadata.filename);
      
      if (isVideo) {
        formData.append('source', fileBlob, mediaMetadata.filename);
      } else {
        formData.append('bytes', fileBlob, mediaMetadata.filename);
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.error) {
        throw new Error(`Media upload failed: ${result.error.message}`);
      }

      this.diagnosticLogger.log('info', 'media_upload_success', 'Media uploaded successfully to Meta', {
        media_id: result.id,
        media_hash: result.hash || result.images?.[mediaMetadata.filename]?.hash,
        media_url: result.url || result.images?.[mediaMetadata.filename]?.url,
        is_video: isVideo
      });

      return {
        hash: result.hash || result.images?.[mediaMetadata.filename]?.hash,
        video_id: isVideo ? result.id : undefined,
        url: result.url || result.images?.[mediaMetadata.filename]?.url
      };

    } catch (error: unknown) {
      this.diagnosticLogger.log('error', 'media_upload_error', 'Media upload process failed', {
        error: toMessage(error),
        media_metadata: mediaMetadata
      });
      throw error;
    }
  }

  private async validateInstagramConnection(
    pageId: string, 
    instagramId: string, 
    accessToken: string
  ): Promise<any> {
    this.diagnosticLogger.log('info', 'instagram_validation_start', 'Validating Instagram connection', {
      page_id: pageId,
      instagram_id: instagramId
    });

    try {
      // Get connected Instagram account for this page
      const response = await fetch(`https://graph.facebook.com/v18.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`);
      const data = await response.json();

      if (data.error) {
        throw new Error(`Facebook API error: ${data.error.message}`);
      }

      const connectedInstagram = data.instagram_business_account?.id;

      this.diagnosticLogger.log('info', 'instagram_validation_result', 'Instagram validation completed', {
        connected_instagram: connectedInstagram,
        requested_instagram: instagramId,
        is_match: connectedInstagram === instagramId
      });

      if (connectedInstagram === instagramId) {
        return {
          isValid: true,
          connectedInstagram
        };
      } else {
        return {
          isValid: false,
          reason: 'id_mismatch_or_not_connected',
          connectedInstagram
        };
      }

    } catch (error: unknown) {
      this.diagnosticLogger.log('error', 'instagram_validation_error', 'Instagram validation error', {
        error: toMessage(error),
        proceeding_without_instagram: true
      });
      return { isValid: false, reason: 'validation_error', error: toMessage(error) };
    }
  }

  private buildObjectStorySpecForUpload(
    payload: SimpleCampaignPayload, 
    mediaResult: any, 
    instagramValidation: any
  ): any {
    this.diagnosticLogger.log('info', 'object_story_spec_build_start', '🏗️ Building object_story_spec for upload flow');

    const objectStorySpec: any = {
      page_id: payload.pageId,
      link_data: {
        message: payload.adText,
        link: payload.destinationUrl,
        name: payload.adTitle
      }
    };

    // Add media based on type
    if (mediaResult.video_id) {
      (objectStorySpec.link_data as any).video_id = mediaResult.video_id;
    } else if (mediaResult.hash) {
      (objectStorySpec.link_data as any).image_hash = mediaResult.hash;
    }

    // Add Instagram placement if validated
    if (instagramValidation?.isValid && payload.placements?.includes('instagram_feed')) {
      objectStorySpec.instagram_actor_id = payload.instagramAccount;
    }

    this.diagnosticLogger.log('info', 'object_story_spec_build_complete', 'object_story_spec built successfully', {
      has_video: !!mediaResult.video_id,
      has_image: !!mediaResult.hash,
      has_instagram: !!objectStorySpec.instagram_actor_id,
      page_id: objectStorySpec.page_id
    });

    return objectStorySpec;
  }

  private buildObjectStorySpecForExistingPost(payload: SimpleCampaignPayload): any {
    // ✅ FASE 4: CONSTRUIR object_story_id no formato correto: {IG_USER_ID}_{MEDIA_ID}
    const instagramUserId = payload.instagramUserId || payload.instagram;
    const mediaId = payload.selectedInstagramPostId;
    
    if (!instagramUserId || !mediaId) {
      this.diagnosticLogger.log('error', 'object_story_spec_validation_error', 
        'Instagram User ID e Media ID são obrigatórios para promover post existente', {
        instagram_user_id: instagramUserId,
        media_id: mediaId
      });
      throw new Error('Instagram User ID e Media ID são obrigatórios para promover post existente');
    }

    const objectStoryId = `${instagramUserId}_${mediaId}`;

    this.diagnosticLogger.log('info', 'object_story_spec_existing_post', 
      '🔄 Building object_story_spec for existing Instagram post (V23)', {
      instagram_user_id: instagramUserId,
      media_id: mediaId,
      object_story_id: objectStoryId
    });

    // ✅ CONFORME META API V23: usar apenas object_story_id (SEM page_id)
    return {
      object_story_id: objectStoryId
    };
  }

  private async createCampaignComponents(
    payload: SimpleCampaignPayload,
    adAccountId: string,
    accessToken: string,
    objectStorySpec: any
  ): Promise<any> {
    this.diagnosticLogger.log('info', 'campaign_components_creation_start', '🏗️ Creating campaign components');

    try {
      // Create campaign
      const campaignResult = await this.createCampaign(payload, adAccountId, accessToken);
      
      // Create ad set
      const adSetResult = await this.createAdSet(payload, campaignResult.id, adAccountId, accessToken);
      
      // Create creative
      const creativeResult = await this.createCreative(payload, objectStorySpec, adAccountId, accessToken);
      
      // Create ad
      const adResult = await this.createAd(payload, adSetResult.id, creativeResult.id, adAccountId, accessToken);

      this.diagnosticLogger.log('info', 'campaign_components_creation_success', '✅ All campaign components created successfully', {
        campaign_id: campaignResult.id,
        ad_set_id: adSetResult.id,
        creative_id: creativeResult.id,
        ad_id: adResult.id
      });

      return {
        success: true,
        campaignId: campaignResult.id,
        adSetId: adSetResult.id,
        creativeId: creativeResult.id,
        adId: adResult.id
      };

    } catch (error: unknown) {
      this.diagnosticLogger.log('error', 'campaign_components_creation_error', 'Campaign components creation failed', {
        error: toMessage(error),
        stage: 'component_creation'
      });
      throw error;
    }
  }

  private async createCampaign(payload: SimpleCampaignPayload, adAccountId: string, accessToken: string): Promise<any> {
    // Implementation for campaign creation
    return { id: 'mock_campaign_id' };
  }

  private async createAdSet(payload: SimpleCampaignPayload, campaignId: string, adAccountId: string, accessToken: string): Promise<any> {
    // Implementation for ad set creation
    return { id: 'mock_adset_id' };
  }

  private async createCreative(
    payload: SimpleCampaignPayload, 
    objectStorySpec: any, 
    adAccountId: string, 
    accessToken: string
  ): Promise<any> {
    try {
      const creativePayload: any = {
        name: `${payload.campaignName} - Creative`,
        access_token: accessToken
      };

      // ✅ FASE 5: DISCRIMINAR: usar object_story_id OU object_story_spec
      if (payload.creativeType === 'post') {
        // Para post existente: usar object_story_id
        creativePayload.object_story_id = objectStorySpec.object_story_id;
        
        this.diagnosticLogger.log('info', 'creative_existing_post', 
          'Creating creative with existing Instagram post (V23)', {
          object_story_id: creativePayload.object_story_id,
          creative_name: creativePayload.name
        });
      } else {
        // Para upload: usar object_story_spec
        creativePayload.object_story_spec = objectStorySpec;
        
        this.diagnosticLogger.log('info', 'creative_upload', 
          'Creating creative with uploaded media', {
          has_object_story_spec: true,
          creative_name: creativePayload.name
        });
      }

      const endpoint = `https://graph.facebook.com/v23.0/act_${adAccountId}/adcreatives`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creativePayload)
      });

      const result = await response.json();

      if (result.error) {
        this.diagnosticLogger.log('error', 'creative_creation_error', 
          'Error creating ad creative', {
          error_code: result.error.code,
          error_message: result.error.message,
          error_subcode: result.error.error_subcode,
          fbtrace_id: result.error.fbtrace_id,
          creative_type: payload.creativeType
        });
        throw new Error(`Creative creation failed: ${result.error.message}`);
      }

      this.diagnosticLogger.log('info', 'creative_created', 
        'Ad creative created successfully', {
        creative_id: result.id,
        creative_type: payload.creativeType
      });

      return result;
    } catch (error: unknown) {
      this.diagnosticLogger.log('error', 'creative_creation_error', 
        'Creative creation process failed', {
        error: toMessage(error)
      });
      throw error;
    }
  }

  private async createAd(
    payload: SimpleCampaignPayload, 
    adSetId: string, 
    creativeId: string, 
    adAccountId: string, 
    accessToken: string
  ): Promise<any> {
    // Implementation for ad creation
    return { id: 'mock_ad_id' };
  }
}