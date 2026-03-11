
export class MetaAdsCreativeEditService {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  /**
   * Atualiza o instagram_actor_id em um criativo existente
   */
  async updateCreativeInstagram(
    creativeId: string,
    instagramId: string,
    accessToken: string
  ): Promise<boolean> {
    console.log('📝 Updating creative Instagram...');
    console.log('🎨 Creative ID:', creativeId);
    console.log('📱 New Instagram ID:', instagramId);

    try {
      // Limpar o ID do Instagram
      const cleanedInstagramId = instagramId.startsWith('ig_') 
        ? instagramId.replace('ig_', '') 
        : instagramId;

      const updateUrl = `${this.baseUrl}/${creativeId}?access_token=${accessToken}`;
      
      const updateData = {
        object_story_spec: {
          instagram_actor_id: cleanedInstagramId
        }
      };

      console.log('📝 Update payload:', JSON.stringify(updateData, null, 2));

      const response = await fetch(updateUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Creative update error:', error);
        throw new Error(`Erro ao atualizar criativo: ${error.error?.message}`);
      }

      const result = await response.json();
      console.log('✅ Creative updated successfully:', result);
      
      return true;
    } catch (error) {
      console.error('❌ Error updating creative Instagram:', error);
      throw error;
    }
  }

  /**
   * Busca detalhes de um criativo
   */
  async getCreativeDetails(
    creativeId: string,
    accessToken: string
  ): Promise<any> {
    console.log('🔍 Fetching creative details for:', creativeId);

    try {
      const detailsUrl = `${this.baseUrl}/${creativeId}?fields=object_story_spec,name&access_token=${accessToken}`;
      
      const response = await fetch(detailsUrl);
      
      if (!response.ok) {
        const error = await response.json();
        console.error('❌ Error fetching creative details:', error);
        throw new Error(`Erro ao buscar detalhes do criativo: ${error.error?.message}`);
      }

      const creative = await response.json();
      console.log('📋 Creative details:', creative);
      
      return creative;
    } catch (error) {
      console.error('❌ Error fetching creative details:', error);
      throw error;
    }
  }

  /**
   * Verifica se um criativo tem Instagram configurado
   */
  async hasInstagramConfigured(
    creativeId: string,
    accessToken: string
  ): Promise<boolean> {
    try {
      const creative = await this.getCreativeDetails(creativeId, accessToken);
      return !!(creative.object_story_spec?.instagram_actor_id);
    } catch (error) {
      console.error('❌ Error checking Instagram configuration:', error);
      return false;
    }
  }
}

export const metaAdsCreativeEditService = new MetaAdsCreativeEditService();
