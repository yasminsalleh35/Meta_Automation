
import { instagramPageConnectionService } from '../../validation/InstagramPageConnectionService';

export class InstagramConnectionValidationService {
  /**
   * Valida a conexão Instagram-Página antes de criar o criativo
   */
  static async validateInstagramConnection(
    pageId: string,
    instagramId: string,
    accessToken: string
  ): Promise<boolean> {
    console.log('🔍 Validating Instagram connection before creative creation...');
    
    try {
      const validation = await instagramPageConnectionService.validateInstagramPageConnection(
        pageId,
        instagramId,
        accessToken
      );

      console.log('📊 Validation result:', validation);

      if (validation.connectionType === 'page_connected') {
        console.log('✅ Instagram is properly connected to page');
        return true;
      } else {
        console.warn('⚠️ Instagram is not properly connected to page:', validation.connectionType);
        return false;
      }
    } catch (error) {
      console.error('❌ Error validating Instagram connection:', error);
      return false;
    }
  }
}
