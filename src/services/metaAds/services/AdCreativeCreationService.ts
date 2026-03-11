
import { InstagramIdResolutionService } from './validation/InstagramIdResolutionService';

interface CreativeConfig {
  name: string;
  object_story_spec: {
    page_id?: string;
    link_data?: {
      link: string;
      message: string;
      name: string;
      description: string;
      call_to_action: {
        type: string;
        value: {
          link: string;
        };
      };
      image_hash?: string;
      video_id?: string; // ✅ NOVO: Suporte para vídeos
    };
    instagram_actor_id?: string;
    object_story_id?: string;
  };
}

import { META_API_VERSION, normalizeAdAccountId, buildMetaApiUrl, logMetaApiRequest } from '../utils/metaApiConstants';

export class AdCreativeCreationService {
  static async createAdCreative(
    creativeConfig: CreativeConfig,
    adAccountId: string,
    accessToken: string
  ): Promise<string> {
    const actId = normalizeAdAccountId(adAccountId);
    
    // ✅ NOVO: Log da configuração do creative
    logMetaApiRequest('CREATIVE-CREATION-REQUEST', {
      ad_account_normalized: actId,
      has_image_hash: !!creativeConfig.object_story_spec.link_data?.image_hash,
      has_video_id: !!creativeConfig.object_story_spec.link_data?.video_id,
      has_instagram_actor_id: !!creativeConfig.object_story_spec.instagram_actor_id
    });

    const url = buildMetaApiUrl(`/${actId}/adcreatives?access_token=${accessToken}`);

    // ✅ ENHANCED: Better Instagram validation before sending to Meta
    let finalConfig = { ...creativeConfig };
    
    // ✅ CORREÇÃO: Verificar se é post existente antes da validação
    if (creativeConfig.object_story_spec.object_story_id && !creativeConfig.object_story_spec.link_data) {
      // Configuração de post existente - usar apenas object_story_id e instagram_actor_id
      console.log('🧩 Creative para post existente detectado, validando configuração...');
      console.log('📱 object_story_id:', creativeConfig.object_story_spec.object_story_id);
      console.log('📱 instagram_actor_id:', creativeConfig.object_story_spec.instagram_actor_id);
      
      // Para posts existentes, não aplicar validação extra nem fallback
      // O ID já deve estar no formato correto vindo da Edge Function
    } else if (creativeConfig.object_story_spec.instagram_actor_id && creativeConfig.object_story_spec.page_id) {
      console.log('📱 Enhanced Instagram validation starting...');
      
      const instagramValidation = await InstagramIdResolutionService.resolveAndValidateInstagramId(
        creativeConfig.object_story_spec.instagram_actor_id,
        creativeConfig.object_story_spec.page_id,
        accessToken
      );

      if (instagramValidation.isValid && instagramValidation.finalId) {
        console.log('✅ Instagram validation successful, using ID:', instagramValidation.finalId);
        finalConfig.object_story_spec.instagram_actor_id = instagramValidation.finalId;
      } else {
        console.warn('⚠️ Instagram validation failed:', instagramValidation.error);
        console.log('🔄 Removing Instagram from creative to avoid API error');
        delete finalConfig.object_story_spec.instagram_actor_id;
      }
    }

    console.log('📝 Final creative config being sent:', JSON.stringify(finalConfig, null, 2));
    console.log('📱 Final Instagram actor ID in config:', finalConfig.object_story_spec.instagram_actor_id);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(finalConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Creative creation error:', errorData);
        console.log('📝 Full error response:', JSON.stringify(errorData, null, 2));
        
        // ✅ ENHANCED: Retry inteligente para erro 100 (instagram_actor_id)
        if (errorData.error?.code === 100 && 
            errorData.error?.message?.includes('instagram_actor_id')) {
          
          logMetaApiRequest('CREATIVE-CREATION-RETRY-WITHOUT-IG', {
            ad_account_normalized: actId,
            error_message: errorData.error.message
          });
          
          // ✅ CORREÇÃO: Para posts existentes, não tentar fallback sem Instagram
          if (creativeConfig.object_story_spec.object_story_id && !creativeConfig.object_story_spec.link_data) {
            console.log('❌ Post existente com erro no Instagram - não removendo Instagram pois descaracteriza requisito');
            throw new Error(`object_story_id inválido para IG post — verifique formato <igActorId>_<igMediaId>: ${errorData.error.message}`);
          }
          
          console.log('🔄 Instagram-specific error detected. Retrying without Instagram...');
          return await this.retryWithoutInstagram(creativeConfig, adAccountId, accessToken);
        }
        
        throw new Error(`Creative creation failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ Creative created successfully:', data.id);
      return data.id;

    } catch (error) {
      console.error('❌ Error creating ad creative:', error);
      throw error;
    }
  }

  /**
   * Retry creative creation without Instagram
   */
  private static async retryWithoutInstagram(
    originalConfig: CreativeConfig,
    adAccountId: string,
    accessToken: string
  ): Promise<string> {
    console.log('🔄 Retrying creative creation without Instagram...');
    
    const fallbackConfig = {
      ...originalConfig,
      object_story_spec: {
        ...originalConfig.object_story_spec
      }
    };
    
    // Remove Instagram from the config
    delete fallbackConfig.object_story_spec.instagram_actor_id;
    
    console.log('🔄 Retrying creative creation with fallback config (no Instagram):', JSON.stringify(fallbackConfig, null, 2));

    const actId = normalizeAdAccountId(adAccountId);
    const url = buildMetaApiUrl(`/${actId}/adcreatives?access_token=${accessToken}`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(fallbackConfig)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Fallback creative creation also failed:', errorData);
        throw new Error(`Fallback creative creation failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('✅ Creative created successfully on retry (without Instagram):', data.id);
      console.warn('⚠️ Instagram foi removido devido a erro de conexão. Verifique as permissões e conexão da conta Instagram com a página Facebook no Meta Business Manager.');
      
      return data.id;

    } catch (error) {
      console.error('❌ Fallback creative creation failed:', error);
      throw error;
    }
  }
}
