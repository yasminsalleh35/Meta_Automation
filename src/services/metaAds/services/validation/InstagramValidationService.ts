
interface InstagramValidationResult {
  isValid: boolean;
  validId?: string;
  accountInfo?: any;
  error?: string;
}

export class InstagramValidationService {
  /**
   * Valida e corrige ID do Instagram antes de enviar para Meta API
   */
  static async validateAndFixInstagramId(
    instagramId: string | undefined,
    pageId: string,
    accessToken: string
  ): Promise<InstagramValidationResult> {
    console.log('📱 Starting Instagram validation process...', {
      instagramId,
      pageId,
      timestamp: new Date().toISOString()
    });

    // Se não há Instagram ID, retorna válido (sem Instagram)
    if (!instagramId || instagramId.trim() === '') {
      console.log('📱 No Instagram ID provided, campaign will be created without Instagram');
      return { isValid: true };
    }

    try {
      // Step 1: Validação direta do ID
      console.log('📱 Step 1: Direct Instagram ID validation');
      const directValidation = await this.validateInstagramIdDirect(instagramId, accessToken);
      
      if (directValidation.isValid) {
        console.log('✅ Direct validation successful');
        return {
          isValid: true,
          validId: instagramId,
          accountInfo: directValidation.accountInfo
        };
      }

      // Step 2: Buscar Instagram conectado à página
      console.log('📱 Step 2: Finding page-connected Instagram accounts');
      const pageConnectedAccounts = await this.getPageConnectedInstagramAccounts(pageId, accessToken);
      
      if (pageConnectedAccounts.length === 0) {
        console.log('⚠️ No Instagram accounts connected to this page, creating without Instagram');
        return { isValid: true }; // Válido sem Instagram
      }

      // Step 3: Usar o primeiro Instagram conectado
      const bestAccount = pageConnectedAccounts[0];
      console.log('📱 Using best available Instagram account:', bestAccount);
      
      return {
        isValid: true,
        validId: bestAccount.id,
        accountInfo: bestAccount
      };

    } catch (error) {
      console.error('❌ Instagram validation failed:', error);
      // Em caso de erro, criar campanha sem Instagram
      console.log('📱 Creating campaign without Instagram due to validation error');
      return { isValid: true }; // Válido sem Instagram
    }
  }

  /**
   * Valida Instagram ID diretamente com Meta API
   */
  private static async validateInstagramIdDirect(
    instagramId: string,
    accessToken: string
  ): Promise<InstagramValidationResult> {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${instagramId}?fields=id,name,username&access_token=${accessToken}`
      );

      if (!response.ok) {
        return { isValid: false, error: `HTTP ${response.status}` };
      }

      const data = await response.json();
      
      if (data.error) {
        return { isValid: false, error: data.error.message };
      }

      return {
        isValid: true,
        validId: data.id,
        accountInfo: data
      };

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Validation failed'
      };
    }
  }

  /**
   * Busca Instagram accounts conectados à página
   */
  private static async getPageConnectedInstagramAccounts(
    pageId: string,
    accessToken: string
  ): Promise<Array<{ id: string; name: string; username?: string }>> {
    try {
      const accounts: Array<{ id: string; name: string; username?: string }> = [];

      // Method 1: Direct page connection
      const pageResponse = await fetch(
        `https://graph.facebook.com/v19.0/${pageId}?fields=instagram_business_account&access_token=${accessToken}`
      );

      if (pageResponse.ok) {
        const pageData = await pageResponse.json();
        if (pageData.instagram_business_account) {
          // Get account details
          const accountResponse = await fetch(
            `https://graph.facebook.com/v19.0/${pageData.instagram_business_account.id}?fields=id,name,username&access_token=${accessToken}`
          );
          
          if (accountResponse.ok) {
            const accountData = await accountResponse.json();
            accounts.push(accountData);
          }
        }
      }

      return accounts;

    } catch (error) {
      console.error('❌ Error getting page Instagram accounts:', error);
      return [];
    }
  }
}
