
import { CampaignCreationData } from '../../types';
import { InstagramValidationService } from '../validation/InstagramValidationService';

export class ObjectStorySpecBuilder {
  /**
   * Constrói o object_story_spec para o criativo
   */
  static async buildObjectStorySpec(
    pageId: string,
    campaignData: CampaignCreationData,
    uploadResult: any,
    accessToken: string
  ): Promise<any> {
    console.log('🏗️ Building object story spec...');
    
    // Build basic object story spec
    const objectStorySpec: any = {
      page_id: pageId,
      link_data: {
        link: campaignData.link_whatsapp,
        message: campaignData.copy || 'Conheça nossos produtos!',
        name: campaignData.copy ? campaignData.copy.substring(0, 100) + '...' : 'Saiba mais',
        description: 'Clique para conversar no WhatsApp',
        call_to_action: {
          type: 'LEARN_MORE',
          value: {
            link: campaignData.link_whatsapp
          }
        }
      }
    };

    // Add media to link_data
    this.addMediaToLinkData(objectStorySpec, uploadResult);

    // Handle Instagram integration with improved validation
    await this.handleInstagramIntegration(objectStorySpec, pageId, campaignData, accessToken);

    return objectStorySpec;
  }

  /**
   * Adiciona mídia (imagem ou vídeo) ao link_data
   */
  private static addMediaToLinkData(objectStorySpec: any, uploadResult: any): void {
    if (uploadResult.video_id) {
      console.log('🎬 Adding video ID to creative:', uploadResult.video_id);
      objectStorySpec.link_data.video_id = uploadResult.video_id;
    } else if (uploadResult.hash) {
      console.log('🖼️ Using image_hash for uploaded image:', uploadResult.hash);
      objectStorySpec.link_data.image_hash = uploadResult.hash;
    } else if (uploadResult.url && !uploadResult.hash) {
      console.log('🖼️ Using picture for external URL:', uploadResult.url);
      objectStorySpec.link_data.picture = uploadResult.url;
    } else {
      console.warn('⚠️ No image hash, video ID, or external URL found in upload result');
    }
  }

  /**
   * Processa integração com Instagram com validação melhorada
   */
  private static async handleInstagramIntegration(
    objectStorySpec: any,
    pageId: string,
    campaignData: CampaignCreationData,
    accessToken: string
  ): Promise<void> {
    console.log('📱 Instagram integration starting with improved validation...');
    
    try {
      // Use the new Instagram validation service
      const validationResult = await InstagramValidationService.validateAndFixInstagramId(
        campaignData.selectedInstagram,
        pageId,
        accessToken
      );

      if (validationResult.isValid && validationResult.validId) {
        console.log('📱 Adding validated Instagram Actor ID to creative:', validationResult.validId);
        objectStorySpec.instagram_actor_id = validationResult.validId;
        console.log('✅ Instagram successfully added to objectStorySpec');
      } else {
        console.log('📱 No valid Instagram found, creating campaign without Instagram integration');
      }
    } catch (error) {
      console.error('❌ Error in Instagram integration:', error);
      console.log('📱 Continuing without Instagram integration due to error');
    }
  }
}
