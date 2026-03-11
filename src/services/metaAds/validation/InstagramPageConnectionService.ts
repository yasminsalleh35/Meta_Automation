
import { metaAdsAccountService } from '../MetaAdsAccountService';

export interface InstagramPageConnection {
  instagramId: string;
  pageId: string;
  isConnected: boolean;
  connectionType: 'page_connected' | 'ad_account_only' | 'disconnected';
  validatedAt: string;
}

export class InstagramPageConnectionService {
  private baseUrl = 'https://graph.facebook.com/v19.0';

  /**
   * Valida se uma conta do Instagram está conectada a uma página específica
   */
  async validateInstagramPageConnection(
    pageId: string,
    instagramId: string,
    accessToken: string
  ): Promise<InstagramPageConnection> {
    console.log('🔍 Validating Instagram-Page connection...');
    console.log('📘 Page ID:', pageId);
    console.log('📱 Instagram ID:', instagramId);

    try {
      // Buscar contas do Instagram conectadas à página
      const connectedInstagramAccounts = await metaAdsAccountService.getConnectedInstagramAccounts(
        pageId,
        accessToken
      );

      console.log('📱 Connected Instagram accounts to page:', connectedInstagramAccounts);

      // Limpar o ID do Instagram (remover prefixo ig_ se presente)
      const cleanInstagramId = instagramId.startsWith('ig_') 
        ? instagramId.replace('ig_', '') 
        : instagramId;

      // Verificar se o Instagram está na lista de conectados à página
      const isPageConnected = connectedInstagramAccounts.some(ig => 
        ig.id === cleanInstagramId || ig.id === instagramId
      );

      console.log('✅ Instagram is page connected:', isPageConnected);

      if (isPageConnected) {
        return {
          instagramId,
          pageId,
          isConnected: true,
          connectionType: 'page_connected',
          validatedAt: new Date().toISOString()
        };
      }

      // Se não está conectado à página, verificar se existe na conta de anúncios
      console.log('🔍 Instagram not page-connected, checking ad account connection...');
      
      return {
        instagramId,
        pageId,
        isConnected: false,
        connectionType: 'ad_account_only',
        validatedAt: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Error validating Instagram-Page connection:', error);
      
      return {
        instagramId,
        pageId,
        isConnected: false,
        connectionType: 'disconnected',
        validatedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Valida múltiplas conexões Instagram-Página
   */
  async validateMultipleConnections(
    pageId: string,
    instagramIds: string[],
    accessToken: string
  ): Promise<InstagramPageConnection[]> {
    console.log('🔍 Validating multiple Instagram-Page connections...');
    
    const validationPromises = instagramIds.map(instagramId =>
      this.validateInstagramPageConnection(pageId, instagramId, accessToken)
    );

    return Promise.all(validationPromises);
  }

  /**
   * Busca a melhor conta do Instagram para uma página
   */
  async findBestInstagramForPage(
    pageId: string,
    availableInstagramIds: string[],
    accessToken: string
  ): Promise<string | null> {
    console.log('🎯 Finding best Instagram account for page:', pageId);

    if (availableInstagramIds.length === 0) {
      return null;
    }

    const validations = await this.validateMultipleConnections(
      pageId,
      availableInstagramIds,
      accessToken
    );

    // Priorizar contas conectadas à página
    const pageConnected = validations.find(v => v.connectionType === 'page_connected');
    if (pageConnected) {
      console.log('✅ Found page-connected Instagram:', pageConnected.instagramId);
      return pageConnected.instagramId;
    }

    // Fallback para primeira conta disponível
    console.log('⚠️ No page-connected Instagram found, using first available');
    return availableInstagramIds[0];
  }
}

export const instagramPageConnectionService = new InstagramPageConnectionService();
